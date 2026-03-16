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

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
  });
}

export { getAuthHeaders };
