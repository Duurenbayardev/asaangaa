import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error("[server error]", err.message, err.stack ?? "");
  }
  const message = status === 500 && config.isProduction ? "Internal server error" : err.message;
  const payload: Record<string, unknown> = { message };
  if (err.code) payload.code = err.code;
  if (status === 500 && !config.isProduction && err.stack) payload.stack = err.stack;
  res.status(status).json(payload);
}
