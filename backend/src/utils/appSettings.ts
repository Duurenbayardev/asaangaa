import fs from "fs/promises";
import path from "path";

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

const SETTINGS_FILE = path.join(process.cwd(), "data", "app-settings.json");

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
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return sanitize(parsed);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(next: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const merged = sanitize({ ...current, ...next });
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

