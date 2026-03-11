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

export async function verifyEmail(token: string): Promise<User> {
  return apiRequest<User>("/auth/verify-email", {
    method: "POST",
    headers: getAuthHeaders(token),
  });
}

export async function loginWithGoogle(
  code: string,
  redirectUri?: string,
  codeVerifier?: string
): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri, codeVerifier }),
  });
}

export async function sendOtp(token: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/send-otp", {
    method: "POST",
    headers: getAuthHeaders(token),
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
