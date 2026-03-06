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

export default router;
