import { Router } from "express";
import { body, param } from "express-validator";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { auth, requireUser, requireAdmin } from "../../middleware/auth";

const CATEGORY_IDS = [
  "nariin-nogoo",
  "jims-jimsgene",
  "hataasan-jims",
  "amtlagch",
  "jimsni-sav-baglaa-boodol",
];

const router = Router();
router.use(auth, requireUser, requireAdmin);

function toProduct(p: { id: string; name: string; categoryId: string; price: unknown; unit: string; description: string | null; images: string[]; tags: string[]; createdAt: Date }) {
  return {
    id: p.id,
    name: p.name,
    category: p.categoryId,
    price: Number(p.price),
    unit: p.unit,
    description: p.description ?? undefined,
    images: p.images ?? [],
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ items: products.map(toProduct) });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  validate([
    body("name").isString().trim().notEmpty(),
    body("categoryId").isIn(CATEGORY_IDS),
    body("price").isFloat({ min: 0 }),
    body("unit").isString().trim().notEmpty(),
    body("description").optional().isString().trim(),
    body("images").optional().isArray(),
    body("images.*").optional().isString(),
    body("tags").optional().isArray(),
    body("tags.*").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const { name, categoryId, price, unit, description, images, tags } = req.body;
      const product = await prisma.product.create({
        data: {
          name,
          categoryId,
          price,
          unit,
          description: description || null,
          images: Array.isArray(images) ? images : [],
          tags: Array.isArray(tags) ? tags : [],
        },
      });
      res.status(201).json(toProduct(product));
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  validate([
    param("id").isString().notEmpty(),
    body("name").optional().isString().trim().notEmpty(),
    body("categoryId").optional().isIn(CATEGORY_IDS),
    body("price").optional().isFloat({ min: 0 }),
    body("unit").optional().isString().trim().notEmpty(),
    body("description").optional().isString().trim(),
    body("images").optional().isArray(),
    body("images.*").optional().isString(),
    body("tags").optional().isArray(),
    body("tags.*").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
        return;
      }
      const updates: Record<string, unknown> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.categoryId !== undefined) updates.categoryId = req.body.categoryId;
      if (req.body.price !== undefined) updates.price = req.body.price;
      if (req.body.unit !== undefined) updates.unit = req.body.unit;
      if (req.body.description !== undefined) updates.description = req.body.description || null;
      if (req.body.images !== undefined) updates.images = req.body.images;
      if (req.body.tags !== undefined) updates.tags = req.body.tags;
      const product = await prisma.product.update({
        where: { id },
        data: updates,
      });
      res.json(toProduct(product));
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  validate([param("id").isString().notEmpty()]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
