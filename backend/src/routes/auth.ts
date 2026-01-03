// backend/src/routes/auth.ts

import { Router } from "express";
import { prisma } from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { auth as auth0Auth } from "express-oauth2-jwt-bearer";
import axios from "axios";
import crypto from "crypto";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// 🔐 Auth0 access-token validator (for SSO route)
const auth0Check = auth0Auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

/**
 * POST /auth/invite
 * Admin/Seller invites a user and gets an invite link.
 */
router.post(
  "/invite",
  requireAuth,
  requireRole(["ADMIN", "SELLER"]),
  async (req: AuthRequest, res) => {
    try {
      const { email, role, companyName } = req.body as {
        email?: string;
        role?: "CUSTOMER" | "SELLER" | "ADMIN";
        companyName?: string;
      };

      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Optional: prevent inviting an email that already exists as a user
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
      }

      // Reuse an active invite if it already exists (pro behavior)
      const now = new Date();
      const existingInvite = await prisma.invite.findFirst({
        where: {
          email: normalizedEmail,
          acceptedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });

      let invite = existingInvite;

      if (!invite) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

        invite = await prisma.invite.create({
          data: {
            email: normalizedEmail,
            role: role || "CUSTOMER",
            companyName: companyName || null,
            token,
            expiresAt,
          },
        });
      }

      const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
      const inviteUrl = `${frontendBase}/accept-invite?token=${invite.token}`;

      return res.json({
        ok: true,
        invite: {
          email: invite.email,
          role: invite.role,
          companyName: invite.companyName,
          expiresAt: invite.expiresAt,
          acceptedAt: invite.acceptedAt,
        },
        inviteUrl,
      });
    } catch (err) {
      console.error("Invite error:", err);
      return res.status(500).json({ error: "Failed to create invite" });
    }
  }
);

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, name, role, companyName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role || "CUSTOMER",
      companyName,
    },
  });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.json({ token, user });
});

// LOGIN (email + password)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  // If user is SSO-only, passwordHash will be null
  if (!user.passwordHash) {
    return res.status(400).json({
      error: "This account uses SSO. Please sign in with Google/Microsoft/Apple.",
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.json({ token, user });
});

// 🔁 SSO LOGIN (Auth0 -> auto-provision + issue app JWT)
router.post("/sso", auth0Check, async (req, res) => {
  try {
    const auth = (req as any).auth;
    const claims = auth?.payload || {};

    // Helpful while debugging (remove later if desired)
    console.log("SSO CLAIMS:", claims);

    // Access token used to call /sso
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    const sub = claims.sub as string | undefined;

    // Often missing on API access tokens (esp Microsoft)
    let email =
      (claims.email as string | undefined) ||
      (claims.upn as string | undefined) ||
      (claims.preferred_username as string | undefined);

    let name =
      (claims.name as string | undefined) ||
      (claims.given_name as string | undefined) ||
      undefined;

    if (!sub) {
      return res.status(400).json({ error: "No sub found in SSO token." });
    }

    // ✅ Fallback: fetch profile from Auth0 /userinfo (often contains name/email)
    if ((!email || !name) && accessToken) {
      try {
        const userinfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
        const userinfoRes = await axios.get(userinfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const ui = userinfoRes.data || {};
        console.log("SSO USERINFO:", ui);

        email =
          email ||
          (ui.email as string | undefined) ||
          (ui.preferred_username as string | undefined) ||
          (ui.upn as string | undefined);

        name =
          name ||
          (ui.name as string | undefined) ||
          (ui.nickname as string | undefined);
      } catch (e) {
        console.warn("Could not fetch /userinfo:", e);
      }
    }

    // ✅ LAST RESORT: if email is still missing, generate a stable placeholder
    // so SSO can still succeed (unique per user, deterministic)
    const needsEmail = !email;
    if (!email) {
      const safeSub = sub.replace(/\|/g, "-").toLowerCase();
      email = `${safeSub}@sso.local`;
    }

    const finalName = name || email.split("@")[0];

    // 1) Find by auth0Sub
    let user = await prisma.user.findUnique({ where: { auth0Sub: sub } });

    // 2) If not found, try linking by email
    if (!user && email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            auth0Sub: sub,
            name: byEmail.name || finalName,
          },
        });
      }
    }

    // 3) If still not found, auto-provision
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          auth0Sub: sub,
          name: finalName,
          role: "CUSTOMER",
          passwordHash: null,
        },
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        needsEmail, // frontend can prompt user to set a real email later
      },
    });
  } catch (err) {
    console.error("SSO login error:", err);
    return res.status(500).json({ error: "SSO login failed." });
  }
});

export default router;