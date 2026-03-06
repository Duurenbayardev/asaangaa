import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";

const router = Router();

router.use(auth, requireUser);

const TAX_RATE = 0.1;
const DELIVERY_FREE_THRESHOLD = 30;
const DELIVERY_FEE = 4.99;

router.post(
  "/",
  validate([
    body("addressId").isString().notEmpty(),
    body("itemIds").optional().isArray(),
    body("itemIds.*").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const userId = req.userId!;
      const { addressId, itemIds } = req.body as { addressId: string; itemIds?: string[] };

      const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        res.status(404).json({ message: "Address not found", code: "NOT_FOUND" });
        return;
      }

      let cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });
      if (Array.isArray(itemIds) && itemIds.length > 0) {
        const idSet = new Set(itemIds);
        cartItems = cartItems.filter((c) => idSet.has(c.productId));
      }
      if (cartItems.length === 0) {
        res.status(400).json({ message: "Basket is empty", code: "EMPTY_BASKET" });
        return;
      }

      const subtotal = cartItems.reduce(
        (sum, c) => sum + Number(c.product.price) * c.quantity,
        0
      );
      const tax = subtotal * TAX_RATE;
      const delivery = subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
      const grandTotal = subtotal + tax + delivery;

      const addressSnapshot = {
        fullName: address.fullName ?? undefined,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        postalCode: address.postalCode ?? undefined,
        instructions: address.instructions ?? undefined,
      };

      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            userId,
            addressId: address.id,
            status: "pending",
            subtotal,
            tax,
            delivery,
            grandTotal,
            addressSnapshot,
            lines: {
              create: cartItems.map((c) => ({
                productId: c.product.id,
                productName: c.product.name,
                quantity: c.quantity,
                unitPrice: c.product.price,
                total: Number(c.product.price) * c.quantity,
              })),
            },
          },
          include: { lines: { include: { product: true } } },
        });
        for (const c of cartItems) {
          await tx.cartItem.deleteMany({
            where: { userId, productId: c.productId },
          });
        }
        return o;
      });

      res.status(201).json({
        id: order.id,
        userId: order.userId,
        status: order.status,
        lines: order.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          total: Number(l.total),
        })),
        address: addressSnapshot,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        delivery: Number(order.delivery),
        grandTotal: Number(order.grandTotal),
        createdAt: order.createdAt.toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });
    res.json(
      orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        status: o.status,
        lines: o.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          total: Number(l.total),
        })),
        address: o.addressSnapshot as Record<string, unknown>,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        delivery: Number(o.delivery),
        grandTotal: Number(o.grandTotal),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))
    );
  } catch (e) {
    next(e);
  }
});

export default router;
