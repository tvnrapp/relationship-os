import { Router } from "express";
import { prisma } from "../prismaClient";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// Get messages between customer and seller
router.get("/:otherUserId", requireAuth, async (req: AuthRequest, res) => {
  const otherId = Number(req.params.otherUserId);

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { customerId: req.user!.id, sellerId: otherId },
        { customerId: otherId, sellerId: req.user!.id }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  res.json(messages);
});

// Send a message
router.post("/:otherUserId", requireAuth, async (req: AuthRequest, res) => {
  const otherId = Number(req.params.otherUserId);
  const { content } = req.body;

  const isCustomer = req.user!.role === "CUSTOMER";

  const msg = await prisma.chatMessage.create({
    data: {
      senderId: req.user!.id,
      customerId: isCustomer ? req.user!.id : otherId,
      sellerId: isCustomer ? otherId : req.user!.id,
      content
    }
  });

  res.json(msg);
});

export default router;