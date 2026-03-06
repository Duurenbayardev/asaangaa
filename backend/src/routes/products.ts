import { Router } from "express";
import { query } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";

const CATEGORY_IDS = [
  "nariin-nogoo",
  "jims-jimsgene",
  "hataasan-jims",
  "amtlagch",
  "jimsni-sav-baglaa-boodol",
] as const;

const router = Router();

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

router.get(
  "/",
  validate([
    query("category").optional().isIn(CATEGORY_IDS),
    query("search").optional().isString().trim(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt(),
  ]),
  async (req, res, next) => {
    try {
      const category = req.query.category as string | undefined;
      const search = (req.query.search as string)?.trim();
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;

      const where: { categoryId?: string; name?: { contains: string; mode: "insensitive" } } = {};
      if (category) where.categoryId = category;
      if (search) where.name = { contains: search, mode: "insensitive" };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { name: "asc" },
          take: limit,
          skip: offset,
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        items: products.map(toProduct),
        total,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/categories", async (_req, res, next) => {
  try {
    const list = await prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, label: true, order: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
      return;
    }
    res.json(toProduct(product));
  } catch (e) {
    next(e);
  }
});

export default router;
