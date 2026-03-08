/**
 * Predefined product units (display values stored in DB).
 * Used for product page label and admin unit picker.
 */
export const PRODUCT_UNITS = [
  "Кг",
  "г",
  "Ширхэг",
  "Л",
  "мЛ",
  "Савлах",
  "Уут",
  "Ширхэг (багц)",
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/** Display on product page: "Тоо ширхэг (Кг)" etc. */
export function getUnitDisplayLabel(unit: string): string {
  if (!unit?.trim()) return "Тоо ширхэг";
  return `Тоо ширхэг (${unit.trim()})`;
}
