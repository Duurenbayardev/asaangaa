import { prisma } from "../lib/prisma";

export type AppSettings = {
  deliveryFee: number;
  deliveryFreeThreshold: number;
  taxEnabled: boolean;
  taxRate: number;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  deliveryFee: 4.99,
  deliveryFreeThreshold: 30,
  taxEnabled: true,
  taxRate: 0.1,
};

const SETTINGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY,
  delivery_fee DOUBLE PRECISION NOT NULL,
  delivery_free_threshold DOUBLE PRECISION NOT NULL,
  tax_enabled BOOLEAN NOT NULL,
  tax_rate DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
`;

function sanitize(input: Partial<AppSettings> | undefined | null): AppSettings {
  const src = input ?? {};
  const deliveryFee =
    typeof src.deliveryFee === "number" && Number.isFinite(src.deliveryFee) && src.deliveryFee >= 0
      ? src.deliveryFee
      : DEFAULT_APP_SETTINGS.deliveryFee;
  const deliveryFreeThreshold =
    typeof src.deliveryFreeThreshold === "number" &&
    Number.isFinite(src.deliveryFreeThreshold) &&
    src.deliveryFreeThreshold >= 0
      ? src.deliveryFreeThreshold
      : DEFAULT_APP_SETTINGS.deliveryFreeThreshold;
  const taxEnabled =
    typeof src.taxEnabled === "boolean" ? src.taxEnabled : DEFAULT_APP_SETTINGS.taxEnabled;
  const taxRate =
    typeof src.taxRate === "number" && Number.isFinite(src.taxRate) && src.taxRate >= 0 && src.taxRate <= 1
      ? src.taxRate
      : DEFAULT_APP_SETTINGS.taxRate;

  return {
    deliveryFee,
    deliveryFreeThreshold,
    taxEnabled,
    taxRate,
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    await prisma.$executeRawUnsafe(SETTINGS_TABLE_SQL);
    const rows = await prisma.$queryRaw<
      Array<{
        delivery_fee: number;
        delivery_free_threshold: number;
        tax_enabled: boolean;
        tax_rate: number;
      }>
    >`SELECT delivery_fee, delivery_free_threshold, tax_enabled, tax_rate FROM app_settings WHERE id = 1`;
    const row = rows[0];
    if (!row) return DEFAULT_APP_SETTINGS;
    return sanitize({
      deliveryFee: Number(row.delivery_fee),
      deliveryFreeThreshold: Number(row.delivery_free_threshold),
      taxEnabled: Boolean(row.tax_enabled),
      taxRate: Number(row.tax_rate),
    });
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(next: Partial<AppSettings>): Promise<AppSettings> {
  const merged = sanitize({ ...(await getAppSettings()), ...next });
  await prisma.$executeRawUnsafe(SETTINGS_TABLE_SQL);
  await prisma.$executeRaw`
    INSERT INTO app_settings (id, delivery_fee, delivery_free_threshold, tax_enabled, tax_rate, updated_at)
    VALUES (1, ${merged.deliveryFee}, ${merged.deliveryFreeThreshold}, ${merged.taxEnabled}, ${merged.taxRate}, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      delivery_fee = EXCLUDED.delivery_fee,
      delivery_free_threshold = EXCLUDED.delivery_free_threshold,
      tax_enabled = EXCLUDED.tax_enabled,
      tax_rate = EXCLUDED.tax_rate,
      updated_at = NOW()
  `;
  return merged;
}

