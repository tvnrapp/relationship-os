import { Router } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config";
import { prisma } from "../prismaClient";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" }) : null;

router.post("/checkout/:quoteId", requireAuth, requireRole(["CUSTOMER"]), async (req: AuthRequest, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  const { quoteId } = req.params;

  const quote = await prisma.quote.findUnique({ where: { id: Number(quoteId) } });
  if (!quote) return res.status(404).json({ error: "Quote not found" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: quote.currency.toLowerCase(),
          unit_amount: Math.round(quote.totalAmount * 100),
          product_data: { name: `Quote ${quote.quoteNumber}` }
        },
        quantity: 1
      }
    ],
    success_url: "http://localhost:5173/payment-success",
    cancel_url: "http://localhost:5173/payment-cancel"
  });

  res.json({ url: session.url });
});

export default router;
