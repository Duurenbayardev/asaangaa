import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { hashPassword } from "../utils/hash";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { normalizeMongolianPhoneToE164, isValidE164 } from "../utils/phone";
import { twilioSendOtp, twilioVerifyOtp } from "../utils/twilio-verify";
import { sendOtpEmail } from "../utils/mail";

const router = Router();

function toUser(u: { id: string; email: string; name: string | null; phone: string | null; role?: string; emailVerified: boolean; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone ?? undefined,
    role: u.role ?? "user",
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
  };
}

router.post(
  "/login",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isString().notEmpty(),
  ]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const { verifyPassword } = await import("../utils/hash");
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ message: "Invalid email or password", code: "INVALID_CREDENTIALS" });
        return;
      }
      const accessToken = signToken({ userId: user.id, email: user.email });
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

router.post(
  "/signup",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("name").optional().isString().trim(),
  ]),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body as { email: string; password: string; name?: string };
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ message: "Email already registered", code: "EMAIL_EXISTS" });
        return;
      }
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, passwordHash, name: name || null },
      });
      const accessToken = signToken({ userId: user.id, email: user.email });
      res.status(201).json({
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

const EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES = 15;

router.post("/send-verification-email", auth, requireUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user?.email) {
      res.status(400).json({ message: "No email on account", code: "NO_EMAIL" });
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
    await prisma.otpCode.deleteMany({ where: { userId: user.id } });
    await prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });
    await sendOtpEmail(user.email, code);
    res.json({ message: "Verification code sent to your email" });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/verify-email",
  auth,
  requireUser,
  validate([body("code").isString().trim().isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits")]),
  async (req, res, next) => {
    try {
    const { code } = req.body as { code: string };
    const userId = req.userId!;
    const record = await prisma.otpCode.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.code !== code || record.expiresAt < new Date()) {
      res.status(400).json({ message: "Invalid or expired code", code: "INVALID_CODE" });
      return;
    }
    await prisma.otpCode.deleteMany({ where: { userId } });
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
    res.json(toUser(user));
  } catch (e) {
    next(e);
  }
  }
);

// ----- Phone verification (Twilio Verify) -----
router.post(
  "/send-otp",
  auth,
  requireUser,
  validate([body("phone").isString().notEmpty().withMessage("Phone number required")]),
  async (req, res, next) => {
    try {
      const { phone } = req.body as { phone: string };
      const to = normalizeMongolianPhoneToE164(phone);
      if (!isValidE164(to)) {
        res.status(400).json({ message: "Invalid phone number", code: "INVALID_PHONE" });
        return;
      }
      await twilioSendOtp(to);
      // Persist phone on user so verify step can be only code-based (keeps frontend simple).
      await prisma.user.update({
        where: { id: req.userId! },
        data: { phone: to },
      });
      res.json({ message: "OTP sent" });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/verify-otp",
  auth,
  requireUser,
  validate([body("code").isString().trim().isLength({ min: 4, max: 10 }).withMessage("Code required")]),
  async (req, res, next) => {
    try {
      const { code } = req.body as { code: string };
      const me = await prisma.user.findUnique({ where: { id: req.userId! } });
      const to = me?.phone ?? "";
      if (!to || !isValidE164(to)) {
        res.status(400).json({ message: "No phone number on account. Send OTP first.", code: "NO_PHONE" });
        return;
      }
      const ok = await twilioVerifyOtp(to, code);
      if (!ok) {
        res.status(400).json({ message: "Invalid code", code: "INVALID_CODE" });
        return;
      }
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: { emailVerified: true },
      });
      res.json(toUser(user));
    } catch (e) {
      next(e);
    }
  }
);

export default router;
