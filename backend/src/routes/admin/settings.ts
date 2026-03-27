import { Router } from "express";
import { body } from "express-validator";
import { auth, requireAdmin, requireUser } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getAppSettings, saveAppSettings } from "../../utils/appSettings";

const router = Router();
router.use(auth, requireUser, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const settings = await getAppSettings();
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

router.put(
  "/",
  validate([
    body("deliveryFee").optional().isFloat({ min: 0 }),
    body("deliveryFreeThreshold").optional().isFloat({ min: 0 }),
    body("taxEnabled").optional().isBoolean(),
    body("taxRate").optional().isFloat({ min: 0, max: 1 }),
    body("supportPhone").optional().isString().trim().isLength({ min: 3, max: 40 }),
    body("supportEmail").optional().isEmail().normalizeEmail(),
  ]),
  async (req, res, next) => {
    try {
      const settings = await saveAppSettings(req.body as Record<string, unknown>);
      res.json(settings);
    } catch (e) {
      next(e);
    }
  }
);

export default router;

