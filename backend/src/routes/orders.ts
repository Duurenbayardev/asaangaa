import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { checkPayment, createInvoice, isQPayConfigured } from "../services/qpay";
import { config } from "../config";
import { sendAdminNewOrderEmail } from "../utils/mail";
import { getAppSettings } from "../utils/appSettings";

const router = Router();

async function notifyAdminOrder(orderId: string): Promise<void> {
  const to = config.admin.mail;
  if (!to) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order) return;

  const address = order.addressSnapshot as {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    instructions?: string;
  } | null;
  const fullAddress = address
    ? [address.fullName, address.line1, address.line2, address.city, address.postalCode, address.instructions]
        .filter((v) => Boolean(v && String(v).trim()))
        .join(", ")
    : undefined;

  await sendAdminNewOrderEmail(to, {
    id: order.id,
    status: String(order.status),
    grandTotal: Number(order.grandTotal),
    createdAtIso: order.createdAt.toISOString(),
    items: order.lines.map((l) => ({ name: l.productName, qty: l.quantity })),
    phone: address?.phone,
    city: address?.city,
    fullAddress,
  });
}

router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await getAppSettings();
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

// QPay callback: no auth (QPay server calls this)
router.post("/qpay-callback", async (req, res, next) => {
  try {
    const invoiceId =
      (req.body?.object_id as string) ?? (req.query?.invoice_id as string);
    if (!invoiceId) {
      res.status(400).json({ error: "Missing object_id or invoice_id" });
      return;
    }
    const order = await prisma.order.findFirst({
      where: { qpayInvoiceId: invoiceId },
      include: { lines: true },
    });
    if (!order) {
      res.status(404).json({ error: "Order not found for invoice" });
      return;
    }
    if ((order.status as string) !== "pending_payment") {
      res.json({ ok: true, status: order.status });
      return;
    }
    const check = await checkPayment(invoiceId);
    const paid = check.rows?.some((r) => r.payment_status === "PAID");
    if (!paid) {
      res.json({ ok: true, paid: false });
      return;
    }
    const productIds = order.lines.map((l) => l.productId);
    const updated = await prisma.order.updateMany({
      where: { id: order.id, status: "pending_payment" },
      data: { status: "confirmed" },
    });
    if (updated.count === 1) {
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId, productId: { in: productIds } },
      });
      notifyAdminOrder(order.id).catch((e) => console.error("[Admin mail] notify failed:", e));
    }
    res.json({ ok: true, paid: true, orderId: order.id });
  } catch (e) {
    next(e);
  }
});

router.use(auth, requireUser);

router.post(
  "/create-with-qpay",
  validate([
    body("addressId").isString().notEmpty(),
    body("phone").isString().trim().notEmpty().withMessage("Phone number is required for delivery"),
    body("itemIds").optional().isArray(),
    body("itemIds.*").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      if (!isQPayConfigured()) {
        res.status(503).json({
          message: "QPay is not configured",
          code: "QPAY_NOT_CONFIGURED",
        });
        return;
      }
      const userId = req.userId!;
      const { addressId, phone, itemIds } = req.body as { addressId: string; phone: string; itemIds?: string[] };

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
      if (cartItems.some((c) => (c.product as unknown as { isActive?: boolean }).isActive === false)) {
        res.status(400).json({ message: "Basket contains unavailable items", code: "UNAVAILABLE_ITEMS" });
        return;
      }

      const settings = await getAppSettings();
      const subtotal = cartItems.reduce(
        (sum, c) => sum + Number(c.product.price) * c.quantity,
        0
      );
      const tax = settings.taxEnabled ? subtotal * settings.taxRate : 0;
      const delivery = subtotal >= settings.deliveryFreeThreshold ? 0 : settings.deliveryFee;
      const grandTotal = subtotal + tax + delivery;

      const addressSnapshot = {
        fullName: address.fullName ?? undefined,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        postalCode: address.postalCode ?? undefined,
        phone: phone.trim(),
        instructions: address.instructions ?? undefined,
      };

      const order = await prisma.$transaction(async (tx) => {
        return tx.order.create({
          data: {
            userId,
            addressId: address.id,
            status: "pending_payment",
            subtotal,
            tax,
            delivery,
            grandTotal,
            addressSnapshot,
            lines: {
              create: cartItems.map((c) => ({
                productId: c.productId,
                productName: c.product.name,
                quantity: c.quantity,
                unitPrice: c.product.price,
                total: Number(c.product.price) * c.quantity,
              })),
            },
          },
          include: { lines: true },
        });
      });

      const callbackBaseUrl = config.qpay.callbackBaseUrl;
      const callbackUrl = `${callbackBaseUrl}/orders/qpay-callback`;
      let invoice;
      try {
        invoice = await createInvoice({
          senderInvoiceNo: order.id,
          invoiceReceiverCode: userId.slice(0, 45),
          invoiceDescription: `Захиалга #${order.id.slice(-8).toUpperCase()}`,
          amount: Number(order.grandTotal),
          callbackUrl,
        });
      } catch (qpayErr) {
        const msg = qpayErr instanceof Error ? qpayErr.message : String(qpayErr);
        console.error("[QPay createInvoice error]", msg);
        res.status(502).json({
          message: "Төлбөрийн сервис (QPay) одоогоор ажиллахгүй байна. Дахин оролдоно уу.",
          code: "QPAY_ERROR",
          detail: config.isProduction ? undefined : msg,
        });
        return;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { qpayInvoiceId: invoice.invoice_id },
      });

      res.status(201).json({
        order: {
          id: order.id,
          status: order.status,
          lines: order.lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice),
            total: Number(l.total),
          })),
          subtotal: Number(order.subtotal),
          tax: Number(order.tax),
          delivery: Number(order.delivery),
          grandTotal: Number(order.grandTotal),
          createdAt: order.createdAt.toISOString(),
        },
        qPay: {
          invoiceId: invoice.invoice_id,
          qrImage: invoice.qr_image,
          qrText: invoice.qr_text,
          urls: invoice.urls,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/",
  validate([
    body("addressId").isString().notEmpty(),
    body("phone").isString().trim().notEmpty().withMessage("Phone number is required for delivery"),
    body("itemIds").optional().isArray(),
    body("itemIds.*").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const userId = req.userId!;
      const { addressId, phone, itemIds } = req.body as { addressId: string; phone: string; itemIds?: string[] };

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
      if (cartItems.some((c) => (c.product as unknown as { isActive?: boolean }).isActive === false)) {
        res.status(400).json({ message: "Basket contains unavailable items", code: "UNAVAILABLE_ITEMS" });
        return;
      }

      const settings = await getAppSettings();
      const subtotal = cartItems.reduce(
        (sum, c) => sum + Number(c.product.price) * c.quantity,
        0
      );
      const tax = settings.taxEnabled ? subtotal * settings.taxRate : 0;
      const delivery = subtotal >= settings.deliveryFreeThreshold ? 0 : settings.deliveryFee;
      const grandTotal = subtotal + tax + delivery;

      const addressSnapshot = {
        fullName: address.fullName ?? undefined,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        postalCode: address.postalCode ?? undefined,
        phone: phone.trim(),
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

      // Notify admin for non-QPay orders (created successfully).
      notifyAdminOrder(order.id).catch((e) => console.error("[Admin mail] notify failed:", e));
    } catch (e) {
      next(e);
    }
  }
);

function toOrderJson(o: {
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
  updatedAt: Date;
}) {
  return {
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
  };
}

router.get("/", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.userId!,
        status: {
          in: ["confirmed", "processing", "shipped", "delivered"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });
    res.json(orders.map(toOrderJson));
  } catch (e) {
    next(e);
  }
});

router.get("/:id/check-payment", async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { lines: true },
    });
    if (!order) {
      res.status(404).json({ message: "Order not found", code: "NOT_FOUND" });
      return;
    }
    const status = order.status as string;
    if (status !== "pending_payment") {
      res.json({ status: order.status, paid: status !== "pending_payment" });
      return;
    }
    if (!order.qpayInvoiceId) {
      res.status(400).json({ message: "No QPay invoice for this order", code: "NO_INVOICE" });
      return;
    }
    const check = await checkPayment(order.qpayInvoiceId);
    const paid = check.rows?.some((r) => r.payment_status === "PAID");
    if (paid) {
      const productIds = order.lines.map((l) => l.productId);
      const updated = await prisma.order.updateMany({
        where: { id: order.id, status: "pending_payment" },
        data: { status: "confirmed" },
      });
      if (updated.count === 1) {
        await prisma.cartItem.deleteMany({
          where: { userId: order.userId, productId: { in: productIds } },
        });
        notifyAdminOrder(order.id).catch((e) => console.error("[Admin mail] notify failed:", e));
      }
      res.json({ status: "confirmed", paid: true });
      return;
    }
    res.json({ status: "pending_payment", paid: false });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { lines: true },
    });
    if (!order) {
      res.status(404).json({ message: "Order not found", code: "NOT_FOUND" });
      return;
    }
    res.json(toOrderJson(order));
  } catch (e) {
    next(e);
  }
});

export default router;
