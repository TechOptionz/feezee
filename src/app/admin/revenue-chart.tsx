import type { SeriesPoint } from "@/modules/reporting";
import { formatPrice } from "@/lib/currency";

/**
 * Revenue per day, drawn as an inline SVG.
 *
 * No charting library. This is one series of at most 31 points on an admin page
 * — a 60 kB dependency to draw thirty rectangles would cost more to load than
 * the whole rest of the screen, and an SVG the server renders needs no
 * hydration at all.
 *
 * Bars rather than a line: daily takings are discrete amounts, and a line
 * between them implies a value at 3pm on Tuesday that nobody measured.
 */
export function RevenueChart({ series }: { series: SeriesPoint[] }) {
  if (series.length === 0) {
    return (
      <p className="m-0 py-10 text-center text-[14px] text-taupe">
        No orders in this range.
      </p>
    );
  }

  const peak = Math.max(...series.map((point) => point.revenueAed), 1);
  const total = series.reduce((sum, point) => sum + point.revenueAed, 0);

  // Every fifth label on a long range, so a month does not print 31 dates on
  // top of each other.
  const labelEvery = Math.ceil(series.length / 7);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="font-display text-[clamp(20px,2.4vw,28px)] leading-none text-champagne">
          {formatPrice(total)}
        </span>
        <span className="text-[12px] tracking-[0.14em] uppercase text-taupe">
          Peak day {formatPrice(peak)}
        </span>
      </div>

      <div
        className="flex items-end gap-[3px]"
        style={{ height: "clamp(120px, 18vw, 190px)" }}
        role="img"
        aria-label={`Revenue by day. Total ${formatPrice(total)}, highest day ${formatPrice(peak)}.`}
      >
        {series.map((point) => {
          // A day that took money always shows at least a sliver, so "a small
          // sale" and "no sale at all" are never the same picture.
          const height = point.revenueAed > 0
            ? Math.max(3, (point.revenueAed / peak) * 100)
            : 0;

          return (
            <div
              key={point.date}
              className="group relative flex-1 min-w-[4px] h-full flex items-end"
            >
              <div
                className="w-full bg-gold/70 transition-colors group-hover:bg-champagne"
                style={{ height: `${height}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap border border-ink-line bg-ink px-2.5 py-1.5 text-[11.5px] text-champagne group-hover:block">
                {new Date(point.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                {" · "}
                {formatPrice(point.revenueAed)}
                {" · "}
                {point.orders} {point.orders === 1 ? "order" : "orders"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex gap-[3px]">
        {series.map((point, i) => (
          <span
            key={point.date}
            className="flex-1 min-w-[4px] text-center text-[10px] text-taupe"
          >
            {i % labelEvery === 0
              ? new Date(point.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
