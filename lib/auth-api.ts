import type { AuthTokens, LoginBody, SignUpBody, User } from "../types/api";
import { apiRequest, getAuthHeaders } from "./api-client";

export async function login(body: LoginBody): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function signUp(body: SignUpBody): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiRequest<User>("/auth/me", {
    method: "GET",
    headers: getAuthHeaders(token),
  });
}

export async function sendVerificationEmail(token: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/send-verification-email", {
    method: "POST",
    headers: getAuthHeaders(token),
  });
}

export async function verifyEmail(token: string, code: string): Promise<User> {
  return apiRequest<User>("/auth/verify-email", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ code: code.trim() }),
  });
}

export async function sendOtp(token: string, phone: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/send-otp", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

export async function verifyOtp(token: string, code: string): Promise<User> {
  return apiRequest<User>("/auth/verify-otp", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ code }),
  });
}

export { getAuthHeaders };
