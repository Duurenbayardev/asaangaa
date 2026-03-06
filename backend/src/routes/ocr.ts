import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { auth, requireUser, requireAdmin } from "../middleware/auth";

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

router.post("/", auth, requireUser, requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ message: "No image file", code: "MISSING_FILE" });
      return;
    }
    const worker = await createWorker("eng", 1, { logger: () => {} });
    const { data } = await worker.recognize(req.file.buffer);
    await worker.terminate();
    res.json({ text: data.text?.trim() ?? "" });
  } catch (e) {
    next(e);
  }
});

export default router;
