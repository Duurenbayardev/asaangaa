import jwt from "jsonwebtoken";
import { config } from "../config";

const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    payload,
    config.jwt.secret as jwt.Secret,
    { expiresIn: SEVEN_DAYS_SEC }
  );
}

export function getExpiresInSeconds(): number {
  return SEVEN_DAYS_SEC;
}
