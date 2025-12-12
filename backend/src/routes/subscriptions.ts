import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * GET /subscriptions/mine
 * Customer: view all their subscriptions
 */
router.get(
  "/mine",
  requireAuth,
  requireRole(["CUSTOMER"]),
  async (req: AuthRequest, res) => {
    try {
      const subs = await prisma.subscription.findMany({
        where: { customerId: req.user!.id },
        include: { entitlements: true, quote: true },
        orderBy: { createdAt: "desc" }
      });

      res.json(subs);
    } catch (err) {
      console.error("Error in GET /subscriptions/mine:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /subscriptions/:id/cancel
 * Customer: cancel a subscription (set status = CANCELLED, stop auto renew)
 */
router.post(
  "/:id/cancel",
  requireAuth,
  requireRole(["CUSTOMER"]),
  async (req: AuthRequest, res) => {
    try {
      const subId = Number(req.params.id);

      const sub = await prisma.subscription.findFirst({
        where: { id: subId, customerId: req.user!.id }
      });

      if (!sub) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const updated = await prisma.subscription.update({
        where: { id: subId },
        data: {
          status: "CANCELLED",
          autoRenew: false,
          endDate: new Date()
        }
      });

      res.json(updated);
    } catch (err) {
      console.error("Error in POST /subscriptions/:id/cancel:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /subscriptions/:id/pause
 * Customer: pause a subscription (set status = PAUSED, stop auto renew)
 */
router.post(
  "/:id/pause",
  requireAuth,
  requireRole(["CUSTOMER"]),
  async (req: AuthRequest, res) => {
    try {
      const subId = Number(req.params.id);

      const sub = await prisma.subscription.findFirst({
        where: { id: subId, customerId: req.user!.id }
      });

      if (!sub) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const updated = await prisma.subscription.update({
        where: { id: subId },
        data: {
          status: "PAUSED",
          autoRenew: false
        }
      });

      res.json(updated);
    } catch (err) {
      console.error("Error in POST /subscriptions/:id/pause:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /subscriptions/:id/resume
 * Customer: resume a paused subscription (set status = ACTIVE, enable auto renew)
 */
router.post(
  "/:id/resume",
  requireAuth,
  requireRole(["CUSTOMER"]),
  async (req: AuthRequest, res) => {
    try {
      const subId = Number(req.params.id);

      const sub = await prisma.subscription.findFirst({
        where: { id: subId, customerId: req.user!.id }
      });

      if (!sub) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const updated = await prisma.subscription.update({
        where: { id: subId },
        data: {
          status: "ACTIVE",
          autoRenew: true
        }
      });

      res.json(updated);
    } catch (err) {
      console.error("Error in POST /subscriptions/:id/resume:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;