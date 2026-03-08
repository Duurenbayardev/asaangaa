import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { auth, requireUser, requireAdmin } from "../middleware/auth";

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error("Only images (jpeg, png, gif, webp) allowed"));
  },
});

router.post("/", auth, requireUser, requireAdmin, upload.single("image"), (req, res, next) => {
  if (!req.file) {
    res.status(400).json({ message: "No image file", code: "MISSING_FILE" });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
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
    const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_BASE64_SIZE) {
      res.status(400).json({ message: "Image too large (max 10MB)", code: "TOO_LARGE" });
      return;
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    const url = `/uploads/${filename}`;
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

export default router;
