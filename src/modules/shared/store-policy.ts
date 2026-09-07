/**
 * Store policy: the numbers, with no database attached.
 *
 * Kept apart from `settings.ts` because that file is marked `server-only` — it
 * reads Prisma — and this one has to be importable from anywhere: the seed
 * script, a client component showing "AED 120 more for free delivery", and the
 * checkout module alike.
 */
export type StoreSettings = {
  /** UAE VAT, as a fraction. 0.05 is the standard rate. */
  vatRate: number;
  /** Spend at or above which delivery is free, in AED. */
  freeShippingThresholdAed: number;
  /** Flat courier charge below that threshold, in AED. */
  standardShippingFeeAed: number;
  /** Days after delivery in which a return can still be asked for. */
  returnWindowDays: number;
};

/**
 * The defaults are the contract; the `StoreSetting` table is an override. A
 * fresh database, a failed read, or a key someone deleted in the admin all
 * still produce a shop that charges the right VAT.
 */
export const DEFAULT_SETTINGS: StoreSettings = {
  vatRate: 0.05,
  freeShippingThresholdAed: 1000,
  standardShippingFeeAed: 25,
  returnWindowDays: 7,
};

export const SETTING_DESCRIPTIONS: Record<keyof StoreSettings, string> = {
  vatRate: "UAE VAT rate applied to the order subtotal, as a fraction.",
  freeShippingThresholdAed:
    "Subtotal in AED at or above which delivery is free.",
  standardShippingFeeAed:
    "Flat courier charge in AED below the free-shipping threshold.",
  returnWindowDays: "Days after delivery in which a return may be requested.",
};
