import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// Seller creates quote
router.post("/", requireAuth, requireRole(["SELLER", "ADMIN"]), async (req: AuthRequest, res) => {
  const { customerId, lines, notes } = req.body;

  if (!customerId || !Array.isArray(lines)) {
    return res.status(400).json({ error: "customerId and lines required" });
  }

  const count = await prisma.quote.count();
  const quoteNumber = `Q-${new Date().getFullYear()}-${1000 + count}`;

  const totalAmount = lines.reduce((sum: number, l: any) => {
    return sum + (l.unitPrice * (l.quantity || 1));
  }, 0);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId,
      sellerId: req.user!.id,
      totalAmount,
      notes,
      status: "SENT",
      lines: {
        create: lines.map((l: any) => ({
          type: l.type,
          name: l.name,
          description: l.description,
          unitPrice: l.unitPrice,
          quantity: l.quantity || 1,
          billingCycle: l.billingCycle || null,
          metadataJson: l.metadataJson ? JSON.stringify(l.metadataJson) : null
        }))
      }
    },
    include: { lines: true }
  });

  res.json(quote);
});

// Customer sees their quotes
router.get("/mine", requireAuth, requireRole(["CUSTOMER"]), async (req: AuthRequest, res) => {
  const quotes = await prisma.quote.findMany({
    where: { customerId: req.user!.id },
    include: { lines: true }
  });
  res.json(quotes);
});

// Customer approves / rejects / changes
router.post("/:id/status", requireAuth, requireRole(["CUSTOMER"]), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  const updated = await prisma.quote.update({
    where: { id: Number(id) },
    data: {
      status,
      notes: comment
    }
  });

  // If approved, create subscription + entitlements
  if (status === "APPROVED") {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(id) },
      include: { lines: true }
    });

    const subscription = await prisma.subscription.create({
      data: {
        customerId: quote!.customerId,
        quoteId: quote!.id,
        name: `Subscription from ${quote!.quoteNumber}`,
        startDate: new Date(),
        autoRenew: true,
        renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        entitlements: {
          create: quote!.lines
            .filter(l => l.type !== "ONE_TIME_PART" && l.type !== "DISCOUNT")
            .map(l => ({
              type: l.type,
              name: l.name,
              capacity: l.quantity,
              metadataJson: l.metadataJson
            }))
        }
      },
      include: { entitlements: true }
    });

    return res.json({ updated, subscription });
  }

  res.json(updated);
});

export default router;
