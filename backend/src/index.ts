// backend/src/index.ts

import express from "express";
import cors from "cors";

import { PORT } from "./config";

// Route modules
import authRoutes from "./routes/auth";
import quoteRoutes from "./routes/quotes";
import subscriptionRoutes from "./routes/subscriptions";
import chatRoutes from "./routes/chat";
import paymentRoutes from "./routes/payments";
import aiRoutes from "./routes/ai";
import sellerRoutes from "./routes/seller";
import customerRoutes from "./routes/customer";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (_, res) => {
  return res.json({ ok: true, message: "Relationship OS backend running" });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/quotes", quoteRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/chat", chatRoutes);
app.use("/payments", paymentRoutes);
app.use("/ai", aiRoutes);
app.use("/seller", sellerRoutes);
app.use("/customer", customerRoutes); 

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});