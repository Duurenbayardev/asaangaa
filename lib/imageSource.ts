/**
 * Resolve product image to a URI that works reliably in Image components.
 * Base64/data URIs are written to a temp file and returned as file:// so we avoid
 * Android URL length limits and native image loader issues with huge data URIs.
 */

import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import { getApiBaseUrl } from "./api-client";

const DATA_URL_REGEX = /^data:image\/(jpeg|png|gif|webp);base64,(.+)$/i;

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Returns a file URI for the given base64 or data URL, writing to cache if needed.
 * Reuses existing file when same content (same hash).
 */
export async function resolveBase64ToFileUri(value: string): Promise<string> {
  let base64: string;
  let ext = "jpg";
  const v = value.trim();
  const match = v.match(DATA_URL_REGEX);
  if (match) {
    ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1];
    base64 = match[2];
  } else {
    base64 = v;
  }
  const name = `img_${simpleHash(base64)}.${ext}`;
  const dir = FileSystem.cacheDirectory?.endsWith("/") ? FileSystem.cacheDirectory : `${FileSystem.cacheDirectory ?? ""}/`;
  const path = `${dir}${name}`;
  const exists = await FileSystem.getInfoAsync(path, { size: false });
  if (exists.exists) {
    return path;
  }
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}

/**
 * Resolve image value to a URI string. For URLs/paths returns sync; for base64
 * returns a Promise that resolves to a file:// URI.
 */
export function resolveImageUri(value: string | undefined): string | Promise<string> | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) {
    const base = getApiBaseUrl().replace(/\/$/, "");
    return `${base}${v}`;
  }
  if (v.startsWith("data:") || (!v.startsWith("http") && !v.startsWith("/"))) {
    return resolveBase64ToFileUri(v.startsWith("data:") ? v : `data:image/jpeg;base64,${v}`);
  }
  return undefined;
}

export function isBase64OrDataUri(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const v = value.trim();
  return v.startsWith("data:") || (!v.startsWith("http://") && !v.startsWith("https://") && !v.startsWith("/"));
}

/**
 * Hook that resolves a product image value (URL, path, or base64) to a URI
 * the Image component can use. Base64 is written to a temp file async.
 */
export function useResolvedImageUri(rawValue: string | undefined): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!rawValue?.trim()) {
      setUri(null);
      return;
    }
    const result = resolveImageUri(rawValue.trim());
    if (typeof result === "string") {
      setUri(result);
      return;
    }
    let cancelled = false;
    result
      .then((resolved) => {
        if (!cancelled) setUri(resolved);
      })
      .catch(() => {
        if (!cancelled) setUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [rawValue]);

  return uri;
}
