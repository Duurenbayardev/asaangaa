import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";

const router = Router();

router.use(auth, requireUser);

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.userId! },
      select: { productId: true },
    });
    res.json({ productIds: items.map((i) => i.productId) });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/",
  validate([body("productIds").isArray(), body("productIds.*").isString()]),
  async (req, res, next) => {
    try {
      const productIds = req.body.productIds as string[];
      const userId = req.userId!;

      await prisma.$transaction(async (tx) => {
        await tx.wishlistItem.deleteMany({ where: { userId } });
        const existing = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true },
        });
        const validIds = new Set(existing.map((p) => p.id));
        for (const id of productIds) {
          if (!validIds.has(id)) continue;
          await tx.wishlistItem.create({
            data: { userId, productId: id },
          });
        }
      });

      const items = await prisma.wishlistItem.findMany({
        where: { userId },
        select: { productId: true },
      });
      res.json({ productIds: items.map((i) => i.productId) });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
