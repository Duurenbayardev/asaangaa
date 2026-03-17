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

export async function sendVerificationEmail(token: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/send-verification-email", {
    method: "POST",
    headers: getAuthHeaders(token),
  });
}

export async function verifyEmailWithCode(token: string, code: string): Promise<User> {
  return apiRequest<User>("/auth/verify-email", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ code }),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiRequest<User>("/auth/me", {
    method: "GET",
    headers: getAuthHeaders(token),
  });
}


export { getAuthHeaders };
