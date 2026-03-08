import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../lib/prisma";

export type JwtPayload = { userId: string; email: string };

export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token", code: "UNAUTHORIZED" });
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      user?: { id: string; email: string; name: string | null; role: string; emailVerified: boolean; createdAt: Date };
    }
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true },
  });
  if (!user) {
    res.status(401).json({ message: "User not found", code: "UNAUTHORIZED" });
    return;
  }
  req.user = { ...user, role: user.role ?? "user" };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required", code: "FORBIDDEN" });
    return;
  }
  next();
}
