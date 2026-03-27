import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";

const uploadDir = config.uploadDir ? path.resolve(config.uploadDir) : path.join(process.cwd(), "uploads");
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import addressRoutes from "./routes/addresses";
import basketRoutes from "./routes/basket";
import wishlistRoutes from "./routes/wishlist";
import orderRoutes from "./routes/orders";
import uploadRoutes from "./routes/upload";
import imageRoutes from "./routes/images";
import ocrRoutes from "./routes/ocr";
import adminRoutes from "./routes/admin";
import legalRoutes from "./routes/legal";
import settingsRoutes from "./routes/settings";

const app = express();

// Required when behind a proxy (e.g. Render, nginx) so rate-limit can use X-Forwarded-For
if (config.isProduction) {
  app.set("trust proxy", 1);
}

app.use(helmet({
  contentSecurityPolicy: config.isProduction,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const corsOptions: cors.CorsOptions = {
  origin: config.cors.origins ?? true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parse JSON body. Use 12mb for /upload/base64 (base64 images), 256kb for everything else.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/upload/base64")) {
    return express.json({ limit: "12mb" })(req, res, next);
  }
  return express.json({ limit: "256kb" })(req, res, next);
});

app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/addresses", addressRoutes);
app.use("/basket", basketRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/orders", orderRoutes);
app.use("/upload", uploadRoutes);
app.use("/images", imageRoutes);
app.use("/ocr", ocrRoutes);
app.use("/admin", adminRoutes);
app.use("/legal", legalRoutes);
app.use("/settings", settingsRoutes);

app.use(errorHandler);

const host = config.isProduction ? "0.0.0.0" : "0.0.0.0";
app.listen(config.server.port, host, () => {
  console.log(`Server listening on http://${host}:${config.server.port} (${config.nodeEnv})`);
}).on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
