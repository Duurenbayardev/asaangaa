import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";

const router = Router();

router.use(auth, requireUser);

function toBasketItem(ci: { quantity: number; product: { id: string; name: string; categoryId: string; price: unknown; unit: string; images: string[] } }) {
  return {
    product: {
      id: ci.product.id,
      name: ci.product.name,
      category: ci.product.categoryId,
      price: Number(ci.product.price),
      unit: ci.product.unit,
      images: ci.product.images ?? [],
    },
    quantity: ci.quantity,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.userId! },
      include: { product: true },
    });
    const basketItems = items.map(toBasketItem);
    const total = basketItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    res.json({ items: basketItems, total });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/",
  validate([
    body("items").isArray(),
    body("items.*.productId").isString().notEmpty(),
    body("items.*.quantity").isInt({ min: 0 }).toInt(),
  ]),
  async (req, res, next) => {
    try {
      const items = req.body.items as { productId: string; quantity: number }[];
      const userId = req.userId!;

      await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { userId } });
        const toCreate = items.filter((i) => i.quantity > 0);
        if (toCreate.length === 0) return;
        const productIds = [...new Set(toCreate.map((i) => i.productId))];
        const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } });
        const productMap = new Map(products.map((p) => [p.id, p]));
        for (const item of toCreate) {
          if (!productMap.has(item.productId)) continue;
          await tx.cartItem.create({
            data: {
              userId,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      });

      const updated = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });
      const basketItems = updated.map(toBasketItem);
      const total = basketItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
      res.json({ items: basketItems, total });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
