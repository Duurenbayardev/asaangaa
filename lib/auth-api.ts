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

/** Call after Firebase Phone Auth: send idToken from Firebase user to link phone to backend account. */
export async function verifyPhone(token: string, idToken: string): Promise<User> {
  return apiRequest<User>("/auth/verify-phone", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ idToken }),
  });
}

export { getAuthHeaders };
