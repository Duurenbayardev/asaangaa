/**
 * Format amount as Mongolian Tugrik (no decimals).
 */
export function formatTugrug(amount: number): string {
  return `${Math.round(amount).toLocaleString()}₮`;
}
