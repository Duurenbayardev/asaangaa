/**
 * Base API client for backend. Set EXPO_PUBLIC_API_URL in .env or app.config.
 * Android emulator: use http://10.0.2.2:3000
 * Physical device: use your machine IP, e.g. http://192.168.1.x:3000
 */

type ExpoConstantsLike = {
  expoConfig?: { extra?: Record<string, unknown>; hostUri?: string };
  manifest?: { debuggerHost?: string };
  manifest2?: { extra?: Record<string, unknown> };
};

function getBaseUrl(): string {
  try {
    const fromProcess = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL;
    if (fromProcess && typeof process.env.EXPO_PUBLIC_API_URL === "string") {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
    }
  } catch (_) {}
  try {
    const expoConstants = require("expo-constants");
    const Constants = (expoConstants.default ?? expoConstants) as ExpoConstantsLike;
    const fromExtra =
      (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL as string | undefined) ??
      (Constants.manifest2?.extra?.EXPO_PUBLIC_API_URL as string | undefined);
    if (fromExtra && typeof fromExtra === "string") {
      return fromExtra.replace(/\/$/, "");
    }
  } catch (_) {}
  return "https://asaangaa.onrender.com";
}

let baseUrl = getBaseUrl();

export function setApiBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

/** Turn relative image paths (e.g. /uploads/xyz.jpg) into absolute URLs so they load from the API server. */
export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = baseUrl.replace(/\/$/, "");
  return u.startsWith("/") ? `${base}${u}` : `${base}/${u}`;
}

export type RequestConfig = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

async function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<string> {
  const url = new URL(path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export async function apiRequest<T>(
  path: string,
  options: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = await buildUrl(path, params);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "Network request failed";
    const err: ApiError = {
      message: `${message}. Tried: ${url}. Base URL: ${baseUrl}`,
      code: "NETWORK_ERROR",
      status: 0,
    };
    throw err;
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = {
      message: (data as { message?: string }).message ?? res.statusText,
      code: (data as { code?: string }).code,
      status: res.status,
    };
    throw err;
  }

  return data as T;
}

/** Attach auth token to requests. Call this after login. */
export function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
