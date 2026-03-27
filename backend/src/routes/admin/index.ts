import { Router } from "express";
import productsRouter from "./products";
import ordersRouter from "./orders";
import settingsRouter from "./settings";

const router = Router();
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/settings", settingsRouter);

export default router;
