import { Router } from "express";
import { prisma } from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { auth as auth0Auth } from "express-oauth2-jwt-bearer";

const router = Router();

// 🔐 Auth0 access-token validator (for SSO route)
const auth0Check = auth0Auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
});

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, name, role, companyName } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

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

  res.json({ token, user });
});

// LOGIN (email + password)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, user });
});

// 🔁 SSO LOGIN (Auth0 -> map to existing user)
router.post("/sso", auth0Check, async (req, res) => {
  try {
    const auth = (req as any).auth;
    const email = auth?.payload?.email as string | undefined;

    if (!email) {
      return res.status(400).json({ error: "No email found in SSO token." });
    }

    // find Relationship OS user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(403).json({
        error:
          "No Relationship OS account is linked to this identity. Contact support.",
      });
    }

    // issue the same JWT we use for normal login
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
      },
    });
  } catch (err) {
    console.error("SSO login error:", err);
    return res.status(500).json({ error: "SSO login failed." });
  }
});

export default router;