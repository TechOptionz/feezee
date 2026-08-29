export const CURRENCIES = ["PKR", "AED", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "PKR";

/** Conversion rates from PKR, matching the source design. */
const RATES: Record<Currency, number> = { PKR: 1, AED: 76, GBP: 355 };

const PREFIX: Record<Currency, string> = { PKR: "Rs ", AED: "AED ", GBP: "£" };

/** Format a PKR amount in the given currency, e.g. `Rs 6,850`. */
export function formatPrice(pkr: number, currency: Currency = DEFAULT_CURRENCY) {
  const value = currency === "PKR" ? pkr : Math.round(pkr / RATES[currency]);
  return `${PREFIX[currency]}${value.toLocaleString("en-US")}`;
}
