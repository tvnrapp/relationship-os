// backend/src/routes/customer.ts

import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

/* -------------------------------------------
   Small helper: estimate monthly cost in USD
------------------------------------------- */
function lineToMonthlyUSD(line: {
  unitPrice: number;
  quantity: number;
  billingCycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | null;
  type: string;
}) {
  if (line.type === "DISCOUNT") return 0;

  const base = line.unitPrice * (line.quantity || 1);

  switch (line.billingCycle) {
    case "MONTHLY":
      return base;
    case "QUARTERLY":
      return base / 3;
    case "YEARLY":
      return base / 12;
    default:
      // one-time items don’t count toward MRR/cost
      return 0;
  }
}

/* -------------------------------------------
   CUSTOMER DASHBOARD
------------------------------------------- */
// GET /customer/dashboard
router.get(
  "/dashboard",
  requireAuth,
  requireRole(["CUSTOMER"]),
  async (req: AuthRequest, res) => {
    const customerId = req.user!.id;

    // Run a few things in parallel
    const [quotes, subs, messages] = await Promise.all([
      prisma.quote.findMany({
        where: { customerId },
        include: {
          seller: { select: { id: true, name: true, email: true } },
          lines: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      prisma.subscription.findMany({
        where: { customerId },
        include: {
          entitlements: true,
          quote: {
            include: { lines: true, seller: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.chatMessage.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    // Calculate active subs + rough monthly spend
    const activeSubs = subs.filter((s) => s.status === "ACTIVE");

    let estimatedMonthlySpend = 0;
    for (const sub of activeSubs) {
      const lines = sub.quote?.lines ?? [];
      for (const line of lines) {
        estimatedMonthlySpend += lineToMonthlyUSD({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          billingCycle: line.billingCycle,
          type: line.type,
        });
      }
    }

    res.json({
      summary: {
        totalQuotes: quotes.length,
        totalSubscriptions: subs.length,
        activeSubscriptions: activeSubs.length,
        estimatedMonthlySpend: Number(estimatedMonthlySpend.toFixed(2)),
      },
      recentQuotes: quotes,
      subscriptions: subs,
      recentMessages: messages,
    });
  }
);

export default router;