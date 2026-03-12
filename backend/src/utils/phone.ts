export function normalizeMongolianPhoneToE164(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");
  // Accept 99123456 or +97699123456 or 97699123456
  if (digits.length === 8) return `+976${digits}`;
  if (digits.length === 11 && digits.startsWith("976")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 9) return `+976${digits.slice(1)}`;
  // Best-effort fallback
  if (digits.startsWith("976")) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

