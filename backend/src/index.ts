import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import addressRoutes from "./routes/addresses";
import basketRoutes from "./routes/basket";
import wishlistRoutes from "./routes/wishlist";
import orderRoutes from "./routes/orders";
import uploadRoutes from "./routes/upload";
import ocrRoutes from "./routes/ocr";
import adminRoutes from "./routes/admin";

const app = express();

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

app.use(express.json({ limit: "256kb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/ocr", ocrRoutes);
app.use("/admin", adminRoutes);

app.use(errorHandler);

app.listen(config.server.port, () => {
  console.log(`Server listening on port ${config.server.port} (${config.nodeEnv})`);
}).on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
