import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export interface AuthUser {
  id: number;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Ensures request has Authorization: Bearer <token>
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;

    if (!payload || !payload.id || !payload.role) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Ensures logged-in user has required role(s)
 */
export function requireRole(roles: AuthUser["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}