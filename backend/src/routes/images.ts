import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const img = await prisma.productImage.findUnique({
      where: { id },
      select: { mimeType: true, data: true },
    });

    if (!img) {
      res.status(404).json({ message: "Image not found", code: "NOT_FOUND" });
      return;
    }

    res.setHeader("Content-Type", img.mimeType);
    // Cache for 30 days (safe because the id is content-addressed-ish / immutable in practice)
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    res.send(Buffer.from(img.data));
  } catch (e) {
    next(e);
  }
});

export default router;
