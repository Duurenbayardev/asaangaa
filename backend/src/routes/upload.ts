import { Router } from "express";
import multer from "multer";
import { auth, requireUser, requireAdmin } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error("Only images (jpeg, png, gif, webp) allowed"));
  },
});

router.post("/", auth, requireUser, requireAdmin, upload.single("image"), (req, res, next) => {
  (async () => {
    if (!req.file) {
      res.status(400).json({ message: "No image file", code: "MISSING_FILE" });
      return;
    }
    const created = await prisma.productImage.create({
      data: {
        mimeType: req.file.mimetype,
        data: new Uint8Array(req.file.buffer),
      },
      select: { id: true },
    });
    const url = `/images/${created.id}`;
    res.json({ url });
  })().catch(next);
});

const DATA_URL_REGEX = /^data:image\/(jpeg|png|gif|webp);base64,(.+)$/i;
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB decoded

router.post("/base64", auth, requireUser, requireAdmin, (req, res, next) => {
  try {
    const dataUrl = req.body?.image;
    if (typeof dataUrl !== "string" || !dataUrl.trim()) {
      res.status(400).json({ message: "Missing image (expected base64 data URL)", code: "MISSING_IMAGE" });
      return;
    }
    const match = dataUrl.match(DATA_URL_REGEX);
    if (!match) {
      res.status(400).json({ message: "Invalid image format (expected data:image/...;base64,...)", code: "INVALID_FORMAT" });
      return;
    }
    const mimeType = `image/${match[1].toLowerCase()}`;
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_BASE64_SIZE) {
      res.status(400).json({ message: "Image too large (max 10MB)", code: "TOO_LARGE" });
      return;
    }
    prisma.productImage.create({
      data: { mimeType, data: new Uint8Array(buffer) },
      select: { id: true },
    }).then((created) => {
      const url = `/images/${created.id}`;
      res.json({ url });
    }).catch(next);
  } catch (e) {
    next(e);
  }
});

export default router;
