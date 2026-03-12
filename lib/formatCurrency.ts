
export function formatTugrug(amount: number): string {
  return `${Math.round(amount).toLocaleString()}₮`;
}
