import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../prismaClient";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import crypto from "crypto";
import type { Invite } from "@prisma/client";

const router = Router();

type Role = "CUSTOMER" | "SELLER" | "ADMIN";
type AuthedUser = { id: number; role: Role };
type AuthedRequest = Request & { user?: AuthedUser };

// -------------------- AUTH HELPERS --------------------

function requireAppJwt(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = auth.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (!payload?.id || !payload?.role) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { id: Number(payload.id), role: payload.role as Role };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireSellerOrAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "SELLER" && req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

// -------------------- UTIL --------------------

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// -------------------- SHARED LOGIC --------------------

type ValidateInviteResult =
  | { ok: true; invite: Invite }
  | { ok: false; status: number; error: string };

async function validateInvite(token: string): Promise<ValidateInviteResult> {
  const tokenHash = sha256(token);
  const invite = await prisma.invite.findUnique({ where: { tokenHash } });

  if (!invite) return { ok: false, status: 404, error: "Invite not found" };
  if (invite.acceptedAt) return { ok: false, status: 400, error: "Invite already used" };
  if (invite.expiresAt.getTime() <= Date.now()) return { ok: false, status: 400, error: "Invite expired" };

  return { ok: true, invite };
}

// -------------------- ROUTES --------------------

/**
 * GET /invites/pending
 * Seller/Admin: list pending invites you created (token is NOT returned)
 */
router.get("/pending", requireAppJwt, requireSellerOrAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const invites = await prisma.invite.findMany({
      where: {
        createdByUserId: req.user!.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        companyName: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        createdByUserId: true,
      },
    });

    return res.json({ invites });
  } catch (err) {
    console.error("Invite pending error:", err);
    return res.status(500).json({ error: "Failed to load pending invites" });
  }
});

/**
 * POST /invites
 * Body: { email: string, role: "CUSTOMER"|"SELLER"|"ADMIN", companyName?: string }
 * Returns: { invite, token, acceptUrl }
 */
router.post("/", requireAppJwt, requireSellerOrAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { email, role, companyName } = req.body as {
      email?: string;
      role?: Role;
      companyName?: string;
    };

    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    const normalizedEmail = normalizeEmail(email);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ✅ safer cleanup: only delete pending invites created by THIS seller/admin for this email
    await prisma.invite.deleteMany({
      where: {
        createdByUserId: req.user!.id,
        email: normalizedEmail,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const invite = await prisma.invite.create({
      data: {
        email: normalizedEmail,
        role,
        companyName: companyName || null,
        tokenHash,
        expiresAt,
        createdByUserId: req.user!.id,
      },
    });

    return res.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        companyName: invite.companyName,
        expiresAt: invite.expiresAt,
        acceptedAt: invite.acceptedAt,
        createdAt: invite.createdAt,
        createdByUserId: invite.createdByUserId,
      },
      token: rawToken, // only shown once; email this
      acceptUrl: `http://localhost:5173/accept-invite?token=${rawToken}`,
    });
  } catch (err) {
    console.error("Invite create error:", err);
    return res.status(500).json({ error: "Failed to create invite" });
  }
});

/**
 * GET /invites/lookup?token=...
 * GET /invites/validate?token=... (alias)
 */
async function lookupHandler(req: Request, res: Response) {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ error: "Missing token" });

    const result = await validateInvite(token);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    const invite = result.invite;

    return res.json({
      invite: {
        email: invite.email,
        role: invite.role,
        companyName: invite.companyName,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err) {
    console.error("Invite lookup error:", err);
    return res.status(500).json({ error: "Failed to lookup invite" });
  }
}

router.get("/lookup", lookupHandler);
router.get("/validate", lookupHandler);

/**
 * POST /invites/accept
 * POST /invites/consume (alias)
 * Body: { token: string, auth0Sub?: string, name?: string }
 * Returns: { token: appJwt, user }
 */
async function acceptHandler(req: Request, res: Response) {
  try {
    const { token, auth0Sub, name } = req.body as {
      token?: string;
      auth0Sub?: string;
      name?: string;
    };

    if (!token) return res.status(400).json({ error: "Missing token" });

    const result = await validateInvite(token);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    const invite = result.invite;

    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    const finalName =
      (name && name.trim()) ||
      (existing?.name && existing.name.trim()) ||
      invite.email.split("@")[0];

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: invite.role,
            companyName: invite.companyName ?? existing.companyName,
            auth0Sub: auth0Sub ?? existing.auth0Sub,
            name: finalName,
            passwordHash: null, // keep SSO-style account
          },
        })
      : await prisma.user.create({
          data: {
            email: invite.email,
            passwordHash: null,
            auth0Sub: auth0Sub ?? null,
            name: finalName,
            role: invite.role,
            companyName: invite.companyName ?? null,
          },
        });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    const appToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token: appToken,
      user,
    });
  } catch (err) {
    console.error("Invite accept error:", err);
    return res.status(500).json({ error: "Failed to accept invite" });
  }
}

router.post("/accept", acceptHandler);
router.post("/consume", acceptHandler);

/**
 * GET /invites/pending
 * Seller/Admin: list unaccepted, unexpired invites created by this user
 */
router.get(
  "/pending",
  requireAppJwt,
  requireSellerOrAdmin,
  async (req: AuthedRequest, res: Response) => {
    try {
      const invites = await prisma.invite.findMany({
        where: {
          createdByUserId: req.user!.id,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ invites });
    } catch (err) {
      console.error("Invites pending error:", err);
      return res.status(500).json({ error: "Failed to load pending invites" });
    }
  }
);

export default router;