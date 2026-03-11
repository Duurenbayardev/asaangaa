import { Router } from "express";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { auth, requireUser } from "../middleware/auth";

const router = Router();

router.use(auth, requireUser);

function toAddress(a: {
  id: string;
  fullName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string | null;
  phone: string | null;
  instructions: string | null;
  createdAt: Date;
}) {
  return {
    id: a.id,
    fullName: a.fullName ?? undefined,
    line1: a.line1,
    line2: a.line2 ?? undefined,
    city: a.city,
    postalCode: a.postalCode ?? undefined,
    phone: a.phone ?? undefined,
    instructions: a.instructions ?? undefined,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const list = await prisma.address.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    res.json(list.map(toAddress));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  validate([
    body("line1").isString().trim().notEmpty(),
    body("city").isString().trim().notEmpty(),
    body("fullName").optional().isString().trim(),
    body("line2").optional().isString().trim(),
    body("postalCode").optional().isString().trim(),
    body("phone").optional().isString().trim(),
    body("instructions").optional().isString().trim(),
  ]),
  async (req, res, next) => {
    try {
      const { line1, city, fullName, line2, postalCode, phone, instructions } = req.body;
      const address = await prisma.address.create({
        data: {
          userId: req.userId!,
          line1,
          city,
          fullName: fullName || null,
          line2: line2 || null,
          postalCode: postalCode || null,
          phone: phone || null,
          instructions: instructions || null,
        },
      });
      res.status(201).json(toAddress(address));
    } catch (e) {
      next(e);
    }
  }
);

export default router;
