import { Router } from "express";
import axios, { AxiosError } from "axios";
import { prisma } from "../prismaClient";
import { OPENAI_API_KEY } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

async function askAI(system: string, user: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing");
    return "AI is not configured on this server yet.";
  }

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    const axErr = err as AxiosError<any>;

    if (axErr.response) {
      const status = axErr.response.status;
      const data = axErr.response.data;

      // Rate limit / quota
      if (status === 429) {
        console.error("⚠️ OpenAI 429 rate limit:", data);
        return "AI is temporarily unavailable due to rate limits. Please try again later.";
      }

      console.error("⚠️ OpenAI error:", status, data);
    } else {
      console.error("⚠️ OpenAI network/client error:", axErr.message);
    }

    return "AI is currently unavailable.";
  }
}

// Explain quote to customer
router.get(
  "/quote-summary/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const quote = await prisma.quote.findUnique({
        where: { id: Number(req.params.id) },
        include: { lines: true }
      });

      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      const text = `
Quote ${quote.quoteNumber}
Total: ${quote.totalAmount}
Lines:
${quote.lines
  .map(l => `${l.name} (${l.type}) x${l.quantity} @ ${l.unitPrice}`)
  .join("\n")}
`;

      const result = await askAI(
        "You are an expert explaining B2B subscription quotes to customers.",
        text
      );

      return res.json({ summary: result });
    } catch (e) {
      console.error("Error in /ai/quote-summary:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Subscription Insights
router.get(
  "/insights/subscriptions",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const subs = await prisma.subscription.findMany({
        where: { customerId: req.user!.id },
        include: { entitlements: true }
      });

      const payload = JSON.stringify(subs);

      const result = await askAI(
        "You are an AI that gives insights about subscription usage and cost optimization.",
        payload
      );

      return res.json({ insights: result });
    } catch (e) {
      console.error("Error in /ai/insights/subscriptions:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;