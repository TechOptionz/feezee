import type { SeriesPoint } from "@/modules/reporting";
import { Figure, LABEL } from "@/app/admin/admin-ui";
import { formatPrice } from "@/lib/currency";
import { shopDayLabel } from "@/lib/shop-time";

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
  const orders = series.reduce((sum, point) => sum + point.orders, 0);

  // Every fifth label on a long range, so a month does not print 31 dates on
  // top of each other.
  const labelEvery = Math.ceil(series.length / 7);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <div className={LABEL}>Taken in this range</div>
          <div className="mt-2 text-[clamp(24px,2.4vw,30px)] font-semibold leading-none tracking-[-0.015em] text-champagne">
            <Figure value={formatPrice(total)} />
          </div>
        </div>
        <dl className="m-0 flex flex-wrap gap-x-7 gap-y-2">
          <div>
            <dt className={LABEL}>Peak day</dt>
            <dd className="m-0 mt-1 text-[15px] font-medium tabular-nums text-sandstone">
              {formatPrice(peak)}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>Orders</dt>
            <dd className="m-0 mt-1 text-[15px] font-medium tabular-nums text-sandstone">
              {orders}
            </dd>
          </div>
        </dl>
      </div>

      <div
        className="flex items-end gap-[3px] border-b border-ink-line"
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
                className="w-full bg-gold/80 transition-colors group-hover:bg-champagne"
                style={{ height: `${height}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap border border-ink-border bg-admin-raised px-3 py-2 text-[12.5px] leading-snug text-sandstone shadow-[0_8px_24px_rgba(0,0,0,0.35)] group-hover:block">
                <span className="block text-[11px] font-medium tracking-[0.1em] uppercase text-taupe">
                  {shopDayLabel(point.date, { weekday: true })}
                </span>
                <span className="mt-0.5 block font-semibold tabular-nums text-champagne">
                  {formatPrice(point.revenueAed)}
                </span>
                <span className="block tabular-nums">
                  {point.orders} {point.orders === 1 ? "order" : "orders"}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-[3px]">
        {series.map((point, i) => (
          <span
            key={point.date}
            className="flex-1 min-w-[4px] text-center text-[11px] font-medium tabular-nums text-taupe"
          >
            {i % labelEvery === 0
              ? shopDayLabel(point.date)
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
