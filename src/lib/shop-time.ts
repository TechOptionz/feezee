/**
 * The shop's clock.
 *
 * FEEZEE trades in Dubai, and a "day" on the dashboard, in a report or on a
 * date filter means a Dubai day, whatever timezone the server happens to run
 * in. Left to the platform default, an order placed at 1am in Dubai would land
 * on yesterday's bar, and a custom range typed as the 24th would start at the
 * server's midnight rather than the shop's.
 *
 * The Gulf has no daylight saving, so the offset is a constant and the maths
 * below can be done on `YYYY-MM-DD` keys without a calendar library.
 */

export const SHOP_TZ = "Asia/Dubai";
const SHOP_OFFSET = "+04:00";

const KEY = /^\d{4}-\d{2}-\d{2}$/;

const keyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` for the Dubai calendar day an instant falls on. */
export function shopDateKey(at: Date): string {
  return keyFormat.format(at);
}

/** Midnight in Dubai at the start of that calendar day, or null for a bad key. */
export function startOfShopDay(key: string): Date | null {
  if (!KEY.test(key)) return null;
  const at = new Date(`${key}T00:00:00${SHOP_OFFSET}`);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** The last instant of that Dubai calendar day, or null for a bad key. */
export function endOfShopDay(key: string): Date | null {
  if (!KEY.test(key)) return null;
  const at = new Date(`${key}T23:59:59.999${SHOP_OFFSET}`);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** The key `days` days after a key — or before it, when `days` is negative. */
export function shiftShopDay(key: string, days: number): string {
  const at = new Date(`${key}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** A day key as the admin prints it: "24 Sept", or "Thu 24 Sept" with the weekday. */
export function shopDayLabel(key: string, options: { weekday?: boolean } = {}): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
    ...(options.weekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
