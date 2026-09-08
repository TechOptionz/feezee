import "server-only";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SETTINGS,
  SETTING_DESCRIPTIONS,
  type StoreSettings,
} from "@/modules/shared/store-policy";

export { DEFAULT_SETTINGS, type StoreSettings };

/**
 * Every setting, with defaults filled in for anything the table is missing.
 *
 * Not cached: these are four small rows read once per checkout, and a shop that
 * changes its VAT rate in the admin expects the very next order to use it.
 */
export async function getSettings(): Promise<StoreSettings> {
  try {
    const rows = await prisma.storeSetting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } },
    });

    const out = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      const key = row.key as keyof StoreSettings;
      const value = typeof row.value === "number" ? row.value : Number(row.value);
      if (key in out && Number.isFinite(value)) out[key] = value;
    }
    return out;
  } catch {
    // A shop that cannot read its settings should still quote the standard
    // ones rather than fail the checkout outright.
    return { ...DEFAULT_SETTINGS };
  }
}

/** Write one setting. Used by the admin; returns the value it stored. */
export async function setSetting<K extends keyof StoreSettings>(
  key: K,
  value: StoreSettings[K],
): Promise<StoreSettings[K]> {
  await prisma.storeSetting.upsert({
    where: { key },
    create: { key, value, description: SETTING_DESCRIPTIONS[key] },
    update: { value },
  });
  return value;
}
