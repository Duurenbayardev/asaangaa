import { Router } from "express";
import { getAppSettings } from "../utils/appSettings";

const router = Router();

router.get("/contact", async (_req, res, next) => {
  try {
    const settings = await getAppSettings();
    res.json({
      supportPhone: settings.supportPhone,
      supportEmail: settings.supportEmail,
    });
  } catch (e) {
    next(e);
  }
});

export default router;

