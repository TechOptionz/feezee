export const CURRENCIES = ["AED", "PKR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** The shop prices in dirhams; everything else is a conversion off it. */
export const DEFAULT_CURRENCY: Currency = "AED";

/**
 * What one unit of each currency is worth in AED.
 *
 * The catalogue holds dirhams, so a price is divided by the rate to reach
 * another currency. The rupee and sterling figures carry over the ratios the
 * source design shipped with (Rs 76 and £1 to 4.67 to the dirham).
 */
const RATES: Record<Currency, number> = { AED: 1, PKR: 1 / 76, GBP: 4.671 };

const PREFIX: Record<Currency, string> = { AED: "AED ", PKR: "Rs ", GBP: "£" };

/** Format an AED amount in the given currency, e.g. `AED 209`. */
export function formatPrice(aed: number, currency: Currency = DEFAULT_CURRENCY) {
  const value = currency === "AED" ? aed : Math.round(aed / RATES[currency]);
  return `${PREFIX[currency]}${value.toLocaleString("en-US")}`;
}
