import Link from "next/link";
import { RANGE_PRESETS, type DateRange, resolveRange } from "@/modules/reporting";
import { ACTION } from "@/app/admin/admin-ui";
import { endOfShopDay, startOfShopDay } from "@/lib/shop-time";
import { cn } from "@/lib/utils";

/**
 * The date filter, as links rather than a control.
 *
 * Held in the query string, so a range is a URL: shareable, bookmarkable, and
 * survives a refresh. That also keeps the whole dashboard a server component —
 * a `useState` here would drag the KPIs and the chart into the browser bundle
 * to do what a link already does.
 */
export function DateRangeTabs({
  preset,
  from,
  to,
  basePath = "/admin",
}: {
  preset: string;
  from?: string;
  to?: string;
  basePath?: string;
}) {
  const custom = Boolean(from && to);

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {RANGE_PRESETS.map((option) => {
        const here = !custom && option === preset;
        return (
          <Link
            key={option}
            href={`${basePath}?range=${encodeURIComponent(option)}`}
            aria-current={here ? "page" : undefined}
            className={cn(
              ACTION,
              "border px-3.5 py-2 transition-colors",
              here
                ? "border-gold bg-gold/10 text-champagne hover:text-champagne"
                : "border-ink-line bg-admin-surface text-taupe hover:border-ink-border hover:text-champagne",
            )}
          >
            {option}
          </Link>
        );
      })}

      {/* A GET form, so the custom range lands in the URL like the presets do. */}
      <form method="get" action={basePath} className="flex flex-wrap items-center gap-1">
        <input
          type="date"
          name="from"
          defaultValue={from}
          aria-label="From date"
          className="border border-ink-line bg-admin-surface px-2.5 py-[6px] text-[13px] tabular-nums text-sandstone outline-none focus:border-gold"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          aria-label="To date"
          className="border border-ink-line bg-admin-surface px-2.5 py-[6px] text-[13px] tabular-nums text-sandstone outline-none focus:border-gold"
        />
        <button
          type="submit"
          className={cn(
            ACTION,
            "cursor-pointer border px-3.5 py-2",
            custom
              ? "border-gold bg-gold/10 text-champagne"
              : "border-ink-line bg-admin-surface text-taupe hover:border-ink-border hover:text-champagne",
          )}
        >
          Apply
        </button>
      </form>
    </div>
  );
}

/**
 * Turn the query string into a range.
 *
 * A custom pair wins when both halves parse; anything else falls back to the
 * named preset, and an unrecognised preset falls back to the last 30 days. A
 * bad date in a URL should show a sensible dashboard, not an error page.
 */
export function rangeFromParams(params: {
  range?: string;
  from?: string;
  to?: string;
}): { range: DateRange; preset: string; from?: string; to?: string } {
  if (params.from && params.to) {
    const from = startOfShopDay(params.from);
    const to = endOfShopDay(params.to);
    if (from && to && from <= to) {
      return { range: { from, to }, preset: "Custom", from: params.from, to: params.to };
    }
  }

  const preset = RANGE_PRESETS.includes(params.range as never)
    ? (params.range as (typeof RANGE_PRESETS)[number])
    : "Last 30 Days";

  return { range: resolveRange(preset), preset };
}
