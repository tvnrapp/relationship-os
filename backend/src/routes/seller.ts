// backend/src/routes/seller.ts

import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

/* -------------------------------------------
   SELLER: GET ALL QUOTES THEY CREATED
------------------------------------------- */
router.get(
  "/quotes",
  requireAuth,
  requireRole(["SELLER", "ADMIN"]),
  async (req: AuthRequest, res) => {
    const quotes = await prisma.quote.findMany({
      where: { sellerId: req.user!.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lines: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(quotes);
  }
);

/* -------------------------------------------
   SELLER: GET ALL SUBSCRIPTIONS CREATED FROM
   THIS SELLER'S QUOTES
------------------------------------------- */
router.get(
  "/subscriptions",
  requireAuth,
  requireRole(["SELLER", "ADMIN"]),
  async (req: AuthRequest, res) => {
    const subs = await prisma.subscription.findMany({
      where: {
        // only subscriptions where quote.sellerId matches this seller
        quote: { sellerId: req.user!.id },
      },
      include: {
        entitlements: true,
        customer: { select: { id: true, name: true, email: true } },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(subs);
  }
);

/* -------------------------------------------
   Helper: convert a quote line into monthly $
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
      // one-time items don't count toward MRR
      return 0;
  }
}

/* -------------------------------------------
   SELLER DASHBOARD SUMMARY
------------------------------------------- */
router.get(
  "/dashboard",
  requireAuth,
  requireRole(["SELLER", "ADMIN"]),
  async (req: AuthRequest, res) => {
    const sellerId = req.user!.id;

    const [
      totalQuotes,
      activeSubs,
      recentQuotes,
      recentSubs,
      recentMessages,
    ] = await Promise.all([
      prisma.quote.count({ where: { sellerId } }),

      prisma.subscription.findMany({
        where: { status: "ACTIVE", quote: { sellerId } },
        include: {
          quote: { include: { lines: true } },
        },
      }),

      prisma.quote.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
      }),

      prisma.subscription.findMany({
        where: { quote: { sellerId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          quote: {
            select: { id: true, quoteNumber: true, status: true },
          },
        },
      }),

      prisma.chatMessage.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    let estimatedMRR = 0;

    for (const sub of activeSubs) {
      const lines = sub.quote?.lines ?? [];
      for (const line of lines) {
        estimatedMRR += lineToMonthlyUSD({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          billingCycle: line.billingCycle,
          type: line.type,
        });
      }
    }

    res.json({
      summary: {
        totalQuotes,
        totalActiveSubscriptions: activeSubs.length,
        estimatedMRR: Number(estimatedMRR.toFixed(2)),
      },
      recentQuotes,
      recentSubscriptions: recentSubs,
      recentMessages,
    });
  }
);

/* -------------------------------------------
   SELLER: LIST UNIQUE CUSTOMERS THEY WORK WITH
------------------------------------------- */
router.get(
  "/customers",
  requireAuth,
  requireRole(["SELLER", "ADMIN"]),
  async (req: AuthRequest, res) => {
    const sellerId = req.user!.id;

    const customers = await prisma.user.findMany({
      where: {
        quotesReceived: {
          some: {
            sellerId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(customers);
  }
);

/* -------------------------------------------
   SELLER: DETAILED VIEW FOR ONE CUSTOMER
------------------------------------------- */
router.get(
  "/customers/:customerId",
  requireAuth,
  requireRole(["SELLER", "ADMIN"]),
  async (req: AuthRequest, res) => {
    const sellerId = req.user!.id;
    const customerId = Number(req.params.customerId);

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const [quotes, subscriptions, messages] = await Promise.all([
      prisma.quote.findMany({
        where: { sellerId, customerId },
        orderBy: { createdAt: "desc" },
        include: { lines: true },
      }),

      prisma.subscription.findMany({
        where: {
          customerId,
          quote: { sellerId },
        },
        orderBy: { createdAt: "desc" },
        include: {
          entitlements: true,
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              totalAmount: true,
              currency: true,
              createdAt: true,
            },
          },
        },
      }),

      prisma.chatMessage.findMany({
        where: { customerId, sellerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    res.json({
      customer,
      quotes,
      subscriptions,
      recentMessages: messages,
    });
  }
);

export default router;