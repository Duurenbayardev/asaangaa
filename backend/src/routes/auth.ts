import { Router } from "express";
import { body } from "express-validator";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";
import { hashPassword } from "../utils/hash";
import { signToken, getExpiresInSeconds } from "../utils/jwt";
import { sendOtpEmail } from "../utils/mail";
import crypto from "crypto";

const router = Router();

function toUser(u: { id: string; email: string; name: string | null; role?: string; emailVerified: boolean; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role ?? "user",
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
  };
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
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

// ----- Google Sign-In (exchange authorization code for our JWT, with PKCE) -----
router.post(
  "/google",
  validate([
    body("code").isString().notEmpty(),
    body("redirectUri").optional().isString(),
    body("codeVerifier").isString().notEmpty().withMessage("PKCE code_verifier is required"),
  ]),
  async (req, res, next) => {
    try {
      const { clientId, clientSecret } = config.google;
      if (!clientId || !clientSecret) {
        res.status(503).json({ message: "Google sign-in is not configured", code: "GOOGLE_DISABLED" });
        return;
      }
      const { code, redirectUri, codeVerifier } = req.body as { code: string; redirectUri?: string; codeVerifier: string };
      const client = new OAuth2Client(clientId, clientSecret, redirectUri ?? "postmessage");
      const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri ?? undefined });
      const idToken = tokens.id_token;
      if (!idToken) {
        res.status(400).json({ message: "No ID token from Google", code: "INVALID_GOOGLE_RESPONSE" });
        return;
      }
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) {
        res.status(400).json({ message: "Invalid Google token", code: "INVALID_GOOGLE_TOKEN" });
        return;
      }
      const email = payload.email;
      const googleId = payload.sub;
      const name = payload.name ?? null;

      let user = await prisma.user.findUnique({ where: { googleId } });
      if (user) {
        // existing Google user
      } else {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          if (user.googleId) {
            // same email already with Google
          } else {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, name: user.name ?? name },
            });
          }
        } else {
          user = await prisma.user.create({
            data: { email, googleId, name, emailVerified: !!payload.email_verified },
          });
        }
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

// ----- OTP verification (email) -----
router.post("/send-otp", auth, requireUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      res.status(401).json({ message: "User not found", code: "UNAUTHORIZED" });
      return;
    }
    await prisma.otpCode.deleteMany({ where: { userId: user.id } });
    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });
    await sendOtpEmail(user.email, code);
    res.json({ message: "OTP sent to your email" });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/verify-otp",
  auth,
  requireUser,
  validate([body("code").isString().trim().notEmpty().isLength({ min: OTP_LENGTH, max: OTP_LENGTH })]),
  async (req, res, next) => {
    try {
      const { code } = req.body as { code: string };
      const record = await prisma.otpCode.findFirst({
        where: { userId: req.userId!, code },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.expiresAt < new Date()) {
        res.status(400).json({ message: "Invalid or expired OTP", code: "INVALID_OTP" });
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

export default router;
