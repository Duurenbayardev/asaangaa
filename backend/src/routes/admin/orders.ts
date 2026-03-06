import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { auth, requireUser, requireAdmin } from "../../middleware/auth";

const router = Router();
router.use(auth, requireUser, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { lines: true, user: { select: { id: true, email: true, name: true } } },
    });
    res.json(
      orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        userEmail: o.user.email,
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
      }))
    );
  } catch (e) {
    next(e);
  }
});

export default router;
