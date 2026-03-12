import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { hashPassword } from "../utils/hash";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { verifyFirebaseIdToken } from "../utils/firebase-admin";

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

router.post("/verify-email", auth, requireUser, async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { emailVerified: true },
    });
    res.json(toUser(user));
  } catch (e) {
    next(e);
  }
});

// ----- Phone verification (Firebase Auth – OTP sent by Firebase, free tier) -----
router.post(
  "/verify-phone",
  auth,
  requireUser,
  validate([body("idToken").isString().notEmpty().withMessage("Firebase ID token required")]),
  async (req, res, next) => {
    try {
      const { idToken } = req.body as { idToken: string };
      const decoded = await verifyFirebaseIdToken(idToken);
      const phone = decoded.phone_number;
      if (!phone) {
        res.status(400).json({ message: "Token does not contain phone number", code: "INVALID_TOKEN" });
        return;
      }
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: { phone, emailVerified: true },
      });
      res.json(toUser(user));
    } catch (e) {
      next(e);
    }
  }
);

export default router;
