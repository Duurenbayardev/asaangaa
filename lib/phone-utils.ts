/** Normalize Mongolian phone input to E.164 for Firebase (+976XXXXXXXX). */
export function toE164(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 8) return "+976" + digits;
  if (digits.length === 11 && digits.startsWith("976")) return "+" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "+976" + digits.slice(1);
  return "+976" + digits;
}
