import { Router } from "express";
import { body, param } from "express-validator";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { auth, requireUser, requireAdmin } from "../../middleware/auth";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

const router = Router();
router.use(auth, requireUser, requireAdmin);

function toAdminOrderJson(o: {
  id: string;
  userId: string;
  status: string;
  lines: { productId: string; productName: string; quantity: number; unitPrice: unknown; total: unknown }[];
  addressSnapshot: unknown;
  subtotal: unknown;
  tax: unknown;
  delivery: unknown;
  grandTotal: unknown;
  createdAt: Date;
  user: { phone: string | null; name: string | null };
}) {
  return {
    id: o.id,
    userId: o.userId,
    userPhone: o.user.phone ?? undefined,
    userName: o.user.name,
    status: o.status,
    lines: o.lines.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      total: Number(l.total),
    })),
    address: o.addressSnapshot,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    delivery: Number(o.delivery),
    grandTotal: Number(o.grandTotal),
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { lines: true, user: { select: { id: true, phone: true, name: true } } },
    });
    res.json(orders.map(toAdminOrderJson));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lines: true, user: { select: { id: true, phone: true, name: true } } },
    });
    if (!order) {
      res.status(404).json({ message: "Order not found", code: "NOT_FOUND" });
      return;
    }
    res.json(toAdminOrderJson(order));
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/:id",
  validate([
    param("id").isString().notEmpty(),
    body("status").isIn(ORDER_STATUSES),
  ]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: (typeof ORDER_STATUSES)[number] };
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ message: "Order not found", code: "NOT_FOUND" });
        return;
      }
      const updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: { lines: true, user: { select: { id: true, phone: true, name: true } } },
      });
      res.json(toAdminOrderJson(updated));
    } catch (e) {
      next(e);
    }
  }
);

export default router;
