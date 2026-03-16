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

function readBaseUrlFromEnv(): string {
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

// Resolved on first use so env/constants are ready when images resolve (fixes wrong base URL)
let baseUrl: string | null = null;

function getBaseUrl(): string {
  if (baseUrl !== null) return baseUrl;
  baseUrl = readBaseUrlFromEnv();
  return baseUrl;
}

export function setApiBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

/**
 * Resolve image source to a URI the Image component can use.
 * - data:image/...;base64,... → returned as-is (inline base64).
 * - http(s)://... → returned as-is.
 * - /uploads/... or uploads/... → absolute URL using API base.
 */
export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (u.startsWith("data:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = getBaseUrl().replace(/\/$/, "");
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

/**
 * If the API returns raw base64 (no "data:" prefix), wrap it as a data URI.
 * Use when product.images[] can be either paths or base64 strings.
 */
export function asImageSource(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim();
  if (v.startsWith("data:") || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) {
    return resolveImageUrl(v);
  }
  return `data:image/jpeg;base64,${v}`;
}

export type RequestConfig = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

async function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<string> {
  const base = getBaseUrl();
  const url = new URL(path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`);
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

/** Parse response as JSON. Throws a clear error if the server returned HTML (e.g. wrong URL or 404/500 page). */
export async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<")) {
    const url = (res as Response & { url?: string }).url ?? getApiBaseUrl();
    const hint =
      res.status === 404
        ? " The route may not exist (redeploy backend?)."
        : res.status >= 500
          ? " Backend may be down or sleeping (e.g. Render free tier – wait ~30s and retry)."
          : " Check that EXPO_PUBLIC_API_URL points to your backend only (e.g. https://asaangaa.onrender.com).";
    throw {
      message: `Server returned HTML instead of JSON (status ${res.status}).${hint} URL: ${url}`,
      code: "INVALID_RESPONSE",
      status: res.status,
    } as ApiError;
  }
  if (!trimmed) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/** Max concurrent API requests to avoid overwhelming the server (e.g. Render rate limits). */
const MAX_CONCURRENT_REQUESTS = 2;
/** Retry up to this many times on 429 (rate limit) or 503 (cold start). */
const MAX_RETRIES = 3;
/** Initial backoff in ms; doubles each retry. */
const RETRY_INITIAL_MS = 1000;

let activeCount = 0;
const queue: Array<() => void> = [];

function runNextInQueue() {
  if (activeCount >= MAX_CONCURRENT_REQUESTS || queue.length === 0) return;
  activeCount++;
  const next = queue.shift();
  if (next) next();
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeCount--;
          runNextInQueue();
        });
    };
    if (activeCount < MAX_CONCURRENT_REQUESTS) {
      activeCount++;
      run();
    } else {
      queue.push(run);
    }
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiRequest<T>(
  path: string,
  options: RequestConfig = {}
): Promise<T> {
  return enqueue(async () => {
    const { params, ...init } = options;
    const url = await buildUrl(path, params);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };

    let attempt = 0;

    while (true) {
      let res: Response;
      try {
        res = await fetch(url, { ...init, headers });
      } catch (e: unknown) {
        const rawMessage =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Network request failed";
        const message =
          typeof __DEV__ !== "undefined" && __DEV__
            ? `${rawMessage}. Tried: ${url}`
            : rawMessage;
        const err: ApiError = {
          message,
          code: "NETWORK_ERROR",
          status: 0,
        };
        throw err;
      }

      const data = await parseJsonResponse(res);

      const rateLimited = res.status === 429 || res.status === 503;
      const canRetry = rateLimited && attempt < MAX_RETRIES;

      if (res.ok) {
        return data as T;
      }

      if (canRetry) {
        attempt++;
        const backoffMs = RETRY_INITIAL_MS * Math.pow(2, attempt - 1);
        await delay(backoffMs);
        continue;
      }

      if (res.status === 401) {
        const isAuthAttempt = /\/auth\/(login|signup)$/i.test(path.replace(/\?.*$/, ""));
        if (!isAuthAttempt) {
          try {
            const { triggerUnauthorized } = require("./auth-callback");
            triggerUnauthorized();
          } catch {
            // ignore if auth-callback not set up
          }
        }
      }

      const err: ApiError = {
        message: (data as { message?: string }).message ?? res.statusText,
        code: (data as { code?: string }).code,
        status: res.status,
      };
      throw err;
    }
  });
}

/** Attach auth token to requests. Call this after login. */
export function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
