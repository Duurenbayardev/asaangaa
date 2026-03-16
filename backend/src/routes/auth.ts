import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { hashPassword } from "../utils/hash";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { sendOtpEmail, sendPasswordResetEmail } from "../utils/mail";

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
    try {
      await sendOtpEmail(user.email, code);
    } catch (mailErr) {
      const message = mailErr instanceof Error ? mailErr.message : "Failed to send verification email.";
      res.status(503).json({ message, code: "MAIL_SEND_FAILED" });
      return;
    }
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

// ----- Forgot / Reset password -----
const PASSWORD_RESET_CODE_EXPIRY_MINUTES = 15;

router.post(
  "/forgot-password",
  validate([body("email").isEmail().normalizeEmail()]),
  async (req, res, next) => {
    try {
      const { email } = req.body as { email: string };
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) {
        res.json({ message: "If an account exists, a code was sent to your email" });
        return;
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60 * 1000);
      await prisma.otpCode.deleteMany({ where: { userId: user.id } });
      await prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt },
      });
      await sendPasswordResetEmail(user.email, code);
      res.json({ message: "If an account exists, a code was sent to your email" });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/reset-password",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("code").isString().trim().isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
    body("newPassword").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ]),
  async (req, res, next) => {
    try {
      const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(400).json({ message: "Invalid or expired code", code: "INVALID_CODE" });
        return;
      }
      const record = await prisma.otpCode.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.code !== code || record.expiresAt < new Date()) {
        res.status(400).json({ message: "Invalid or expired code", code: "INVALID_CODE" });
        return;
      }
      await prisma.otpCode.deleteMany({ where: { userId: user.id } });
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      res.json({ message: "Password updated" });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
