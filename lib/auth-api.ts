import type { AuthTokens, User } from "../types/api";
import { apiRequest, getAuthHeaders } from "./api-client";

/** Send OTP to phone (public, no token). */
export async function requestOtp(phone: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

/** Verify OTP and log in or sign up (public). Returns token + user. */
export async function verifyOtp(phone: string, code: string): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiRequest<User>("/auth/me", {
    method: "GET",
    headers: getAuthHeaders(token),
  });
}

export { getAuthHeaders };
