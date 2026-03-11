/**
 * Simple TTL cache using AsyncStorage. Reduces API requests by serving
 * cached data when still fresh and revalidating in the background.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "@asaangaa_cache_";
const META_SUFFIX = "_meta";

export type CacheMeta = { ts: number; ttlMs: number };

function cacheKey(name: string): string {
  return `${KEY_PREFIX}${name}`;
}

function metaKey(name: string): string {
  return `${KEY_PREFIX}${name}${META_SUFFIX}`;
}

/**
 * Get cached value if present and not expired. Returns null if missing or expired.
 */
export async function getCached<T>(name: string): Promise<T | null> {
  try {
    const [raw, metaRaw] = await Promise.all([
      AsyncStorage.getItem(cacheKey(name)),
      AsyncStorage.getItem(metaKey(name)),
    ]);
    if (raw == null || metaRaw == null) return null;
    const meta: CacheMeta = JSON.parse(metaRaw);
    const age = Date.now() - meta.ts;
    if (age > meta.ttlMs) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store value with TTL (in milliseconds). Use same name for same resource.
 */
export async function setCached<T>(name: string, value: T, ttlMs: number): Promise<void> {
  try {
    const meta: CacheMeta = { ts: Date.now(), ttlMs };
    await Promise.all([
      AsyncStorage.setItem(cacheKey(name), JSON.stringify(value)),
      AsyncStorage.setItem(metaKey(name), JSON.stringify(meta)),
    ]);
  } catch {
    // ignore storage errors
  }
}

/**
 * Remove cached value (e.g. on logout).
 */
export async function removeCached(name: string): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(cacheKey(name)),
      AsyncStorage.removeItem(metaKey(name)),
    ]);
  } catch {
    // ignore
  }
}

/** TTL: 5 minutes for product list */
export const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;
/** TTL: 2 minutes for basket (so we don't show stale cart too long) */
export const BASKET_CACHE_TTL_MS = 2 * 60 * 1000;
/** TTL: 5 minutes for addresses */
export const ADDRESSES_CACHE_TTL_MS = 5 * 60 * 1000;

export const CACHE_KEYS = {
  products: "products",
  basket: (userId: string) => `basket_${userId}`,
  addresses: (userId: string) => `addresses_${userId}`,
} as const;
