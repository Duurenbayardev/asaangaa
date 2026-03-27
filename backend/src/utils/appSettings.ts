import { prisma } from "../lib/prisma";

export type AppSettings = {
  deliveryFee: number;
  deliveryFreeThreshold: number;
  taxEnabled: boolean;
  taxRate: number;
  supportPhone: string;
  supportEmail: string;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  deliveryFee: 4.99,
  deliveryFreeThreshold: 30,
  taxEnabled: true,
  taxRate: 0.1,
  supportPhone: "+97699119911",
  supportEmail: "support@asaangaa.mn",
};

const SETTINGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY,
  delivery_fee DOUBLE PRECISION NOT NULL,
  delivery_free_threshold DOUBLE PRECISION NOT NULL,
  tax_enabled BOOLEAN NOT NULL,
  tax_rate DOUBLE PRECISION NOT NULL,
  support_phone TEXT NOT NULL DEFAULT '+97699119911',
  support_email TEXT NOT NULL DEFAULT 'support@asaangaa.mn',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
`;
const SETTINGS_ALTER_SQL = `
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS support_phone TEXT NOT NULL DEFAULT '+97699119911';
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS support_email TEXT NOT NULL DEFAULT 'support@asaangaa.mn';
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
  const supportPhone =
    typeof src.supportPhone === "string" && src.supportPhone.trim().length > 0
      ? src.supportPhone.trim()
      : DEFAULT_APP_SETTINGS.supportPhone;
  const supportEmail =
    typeof src.supportEmail === "string" && src.supportEmail.trim().length > 0
      ? src.supportEmail.trim()
      : DEFAULT_APP_SETTINGS.supportEmail;

  return {
    deliveryFee,
    deliveryFreeThreshold,
    taxEnabled,
    taxRate,
    supportPhone,
    supportEmail,
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    await prisma.$executeRawUnsafe(SETTINGS_TABLE_SQL);
    await prisma.$executeRawUnsafe(SETTINGS_ALTER_SQL);
    const rows = await prisma.$queryRaw<
      Array<{
        delivery_fee: number;
        delivery_free_threshold: number;
        tax_enabled: boolean;
        tax_rate: number;
        support_phone: string;
        support_email: string;
      }>
    >`SELECT delivery_fee, delivery_free_threshold, tax_enabled, tax_rate, support_phone, support_email FROM app_settings WHERE id = 1`;
    const row = rows[0];
    if (!row) return DEFAULT_APP_SETTINGS;
    return sanitize({
      deliveryFee: Number(row.delivery_fee),
      deliveryFreeThreshold: Number(row.delivery_free_threshold),
      taxEnabled: Boolean(row.tax_enabled),
      taxRate: Number(row.tax_rate),
      supportPhone: String(row.support_phone ?? ""),
      supportEmail: String(row.support_email ?? ""),
    });
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(next: Partial<AppSettings>): Promise<AppSettings> {
  const merged = sanitize({ ...(await getAppSettings()), ...next });
  await prisma.$executeRawUnsafe(SETTINGS_TABLE_SQL);
  await prisma.$executeRawUnsafe(SETTINGS_ALTER_SQL);
  await prisma.$executeRaw`
    INSERT INTO app_settings (id, delivery_fee, delivery_free_threshold, tax_enabled, tax_rate, support_phone, support_email, updated_at)
    VALUES (1, ${merged.deliveryFee}, ${merged.deliveryFreeThreshold}, ${merged.taxEnabled}, ${merged.taxRate}, ${merged.supportPhone}, ${merged.supportEmail}, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      delivery_fee = EXCLUDED.delivery_fee,
      delivery_free_threshold = EXCLUDED.delivery_free_threshold,
      tax_enabled = EXCLUDED.tax_enabled,
      tax_rate = EXCLUDED.tax_rate,
      support_phone = EXCLUDED.support_phone,
      support_email = EXCLUDED.support_email,
      updated_at = NOW()
  `;
  return merged;
}

