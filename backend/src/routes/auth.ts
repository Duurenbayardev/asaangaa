import { Router } from "express";
import { body } from "express-validator";
import { randomInt } from "crypto";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { hashPassword } from "../utils/hash";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { sendPasswordResetCodeEmail, sendVerificationCodeEmail } from "../utils/mail";

const router = Router();

const EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_CODE_EXPIRY_MINUTES = 15;

function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

function generatePasswordResetCode(): string {
  return randomInt(100000, 999999).toString();
}

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
    body("passwordConfirm").custom((val, { req }) => {
      if (val !== (req.body as { password?: string }).password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
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
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      await prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt },
      });
      await sendVerificationCodeEmail(user.email, code);
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

router.post(
  "/send-verification-email",
  auth,
  requireUser,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user) {
        res.status(401).json({ message: "User not found", code: "UNAUTHORIZED" });
        return;
      }
      if (user.emailVerified) {
        res.json({ message: "Email already verified" });
        return;
      }
      await prisma.otpCode.deleteMany({ where: { userId: user.id } });
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      await prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt },
      });
      await sendVerificationCodeEmail(user.email, code);
      res.json({ message: "Verification code sent" });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/verify-email",
  auth,
  requireUser,
  validate([body("code").isString().trim().isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits")]),
  async (req, res, next) => {
    try {
      const { code } = req.body as { code: string };
      const record = await prisma.otpCode.findFirst({
        where: { userId: req.userId!, code },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.expiresAt < new Date()) {
        res.status(400).json({ message: "Invalid or expired code", code: "INVALID_CODE" });
        return;
      }
      await prisma.otpCode.deleteMany({ where: { userId: req.userId! } });
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

// Request a password reset code (emailed). Always returns 200 to avoid leaking which emails exist.
router.post(
  "/forgot-password",
  validate([body("email").isEmail().normalizeEmail()]),
  async (req, res, next) => {
    try {
      const { email } = req.body as { email: string };
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });
        const code = generatePasswordResetCode();
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60 * 1000);
        await prisma.passwordResetCode.create({
          data: { userId: user.id, code, expiresAt },
        });
        // Respond before SMTP — slow/hanging mail was causing client "request timed out".
        const emailTo = user.email;
        void sendPasswordResetCodeEmail(emailTo, code).catch((err) => {
          console.error("[auth] forgot-password email failed:", err);
        });
      }
      res.json({ message: "If the email exists, a reset code was sent." });
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
      const record = await prisma.passwordResetCode.findFirst({
        where: { userId: user.id, code, usedAt: null },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.expiresAt < new Date()) {
        res.status(400).json({ message: "Invalid or expired code", code: "INVALID_CODE" });
        return;
      }
      const passwordHash = await hashPassword(newPassword);
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
        prisma.passwordResetCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        prisma.passwordResetCode.deleteMany({ where: { userId: user.id, id: { not: record.id } } }),
      ]);
      res.json({ message: "Password reset successfully" });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
