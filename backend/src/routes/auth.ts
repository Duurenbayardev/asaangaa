import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { normalizeMongolianPhoneToE164, isValidE164 } from "../utils/phone";
import { twilioSendOtp, twilioVerifyOtp } from "../utils/twilio-verify";

const router = Router();

function toUser(u: { id: string; email: string | null; name: string | null; phone: string | null; role?: string; emailVerified: boolean; createdAt: Date }) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone ?? undefined,
    role: u.role ?? "user",
    verified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
  };
}

// ----- Phone-only auth (public) -----
router.post(
  "/send-otp",
  validate([body("phone").isString().notEmpty().withMessage("Phone number required")]),
  async (req, res, next) => {
    try {
      const { phone } = req.body as { phone: string };
      const to = normalizeMongolianPhoneToE164(phone.trim());
      if (!isValidE164(to)) {
        res.status(400).json({ message: "Invalid phone number", code: "INVALID_PHONE" });
        return;
      }
      await twilioSendOtp(to);
      res.json({ message: "OTP sent" });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/verify-otp",
  validate([
    body("phone").isString().notEmpty().withMessage("Phone number required"),
    body("code").isString().trim().isLength({ min: 4, max: 10 }).withMessage("Code required"),
  ]),
  async (req, res, next) => {
    try {
      const { phone, code } = req.body as { phone: string; code: string };
      const to = normalizeMongolianPhoneToE164(phone.trim());
      if (!isValidE164(to)) {
        res.status(400).json({ message: "Invalid phone number", code: "INVALID_PHONE" });
        return;
      }
      const ok = await twilioVerifyOtp(to, code);
      if (!ok) {
        res.status(400).json({ message: "Invalid code", code: "INVALID_CODE" });
        return;
      }
      let user = await prisma.user.findUnique({ where: { phone: to } });
      if (!user) {
        user = await prisma.user.create({
          data: { phone: to, emailVerified: true },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
      const accessToken = signToken({ userId: user.id });
      res.json({
        accessToken,
        expiresIn: getExpiresInSeconds(),
        user: toUser(user),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/me", auth, requireUser, (req, res) => {
  res.json(toUser(req.user!));
});

export default router;
