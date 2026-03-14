/**
 * Global callback for 401 Unauthorized. When the API returns 401 (e.g. token expired),
 * the app should clear auth and redirect to login. Root layout registers this.
 */
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

export function triggerUnauthorized(): void {
  onUnauthorized?.();
}
