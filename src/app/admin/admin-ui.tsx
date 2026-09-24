import Link from "next/link";
import { SHOP_TZ } from "@/lib/shop-time";
import { cn } from "@/lib/utils";

/**
 * The admin's own vocabulary.
 *
 * The back office is drawn on the shop's cream and gold, so the two feel like
 * one product; what tells them apart is the rail down the left, the "Back
 * office" line under the lockup, and the fact that everything here is a table.
 * The colour names below (`champagne`, `sandstone`, `taupe`) are the shop's
 * ink-footer vocabulary, re-bound to cream-ground shades by `.fz-admin` in
 * globals.css — see the note there.
 *
 * Type is the other half of it. The shop reads like a magazine: Marcellus
 * headings, light Jost body, wide tracking. A back office is read for its
 * numbers, so here the labels are small but firm, the body is a step larger,
 * and every figure is set in the admin's sans with tabular digits (see
 * `.fz-admin` in globals.css). Marcellus survives only where the brand does —
 * the lockup and the page title.
 */

/** Small caps label: a column head, a field label, an eyebrow over a figure. */
export const LABEL = "text-[11.5px] font-medium tracking-[0.12em] uppercase text-taupe";

/** The small uppercase action link or button text. */
export const ACTION = "text-[12px] font-medium tracking-[0.1em] uppercase";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border border-ink-line bg-admin-surface p-[clamp(16px,2.2vw,24px)]",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-line pb-3">
          {title && (
            <h2 className="m-0 text-[12.5px] font-semibold tracking-[0.14em] uppercase text-champagne">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A number, set to be read.
 *
 * `formatPrice` returns `AED 1,240`; on a card the currency deserves to be
 * there but not at the size of the amount, so the unit is split off and set
 * small and muted beside the figure. A plain count (`12`) has no unit and
 * comes through untouched.
 */
export function Figure({
  value,
  className,
  unitClassName,
}: {
  value: string;
  className?: string;
  unitClassName?: string;
}) {
  const match = /^([^\d-]+?)\s*(\d[\d,.\s]*)$/.exec(value.trim());

  if (!match) {
    return <span className={cn("tabular-nums", className)}>{value}</span>;
  }

  const [, unit, amount] = match;

  return (
    <span className={cn("inline-flex items-baseline gap-[0.3em] tabular-nums", className)}>
      <span
        className={cn(
          "text-[0.42em] font-medium tracking-[0.1em] uppercase text-taupe",
          unitClassName,
        )}
      >
        {unit.trim()}
      </span>
      <span>{amount}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn";
  href?: string;
}) {
  const body = (
    <>
      <div className={LABEL}>{label}</div>
      <div
        className={cn(
          "mt-3 text-[length:clamp(22px,2.1vw,30px)] font-semibold leading-none tracking-[-0.015em]",
          tone === "warn" ? "text-wine-bright" : "text-champagne",
        )}
      >
        <Figure
          value={value}
          unitClassName={tone === "warn" ? "text-wine-bright/80" : undefined}
        />
      </div>
      {hint && <div className="mt-2.5 text-[12.5px] leading-snug text-taupe">{hint}</div>}
    </>
  );

  const className = cn(
    "block border p-[clamp(16px,2.2vw,22px)] transition-colors",
    tone === "warn"
      ? "border-wine/50 bg-wine/10"
      : "border-ink-line bg-admin-surface",
    href && "hover:border-gold hover:bg-admin-raised",
  );

  return href ? (
    <Link href={href} className={cn(className, "text-champagne hover:text-champagne")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** The status chip, in the admin's palette. */
export function AdminPill({ status }: { status: string }) {
  const tone =
    status === "DELIVERED" || status === "PAID" || status === "REFUNDED"
      ? "border-gold/50 text-gold-light bg-gold/10"
      : status === "CANCELLED" || status === "REJECTED" || status === "FAILED"
        ? "border-wine/50 text-wine-bright bg-wine/10"
        : status === "DISPATCHED" || status === "APPROVED"
          ? "border-champagne/40 text-champagne bg-champagne/10"
          : "border-ink-border text-sandstone bg-admin-raised/60";

  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-[3px] text-[11px] font-medium tracking-[0.08em] uppercase whitespace-nowrap",
        tone,
      )}
    >
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

/** A table that scrolls sideways rather than squashing on a laptop. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-1 px-1">{children}</div>;
}

export function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-ink-line py-2.5 pr-5 text-left",
        LABEL,
        align === "right" && "text-right pr-0",
      )}
    >
      {children}
    </th>
  );
}

/**
 * A cell. Right-aligned cells hold figures — totals, counts, what is left —
 * and are set brighter than the prose beside them, because they are what the
 * row is read for.
 */
export function Td({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-ink-line/70 py-3 pr-5 text-[14px] leading-snug text-sandstone align-top",
        align === "right" && "text-right pr-0 tabular-nums text-champagne",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ span, children }: { span: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={span} className="py-10 text-center text-[14px] text-taupe">
        {children}
      </td>
    </tr>
  );
}

/**
 * The page title.
 *
 * A section name ("Orders") is set in Marcellus like the rest of the brand. An
 * `identifier` — an order or return number — is not: Marcellus draws a 0 and
 * an O, a 1 and an I, almost the same, and a reference nobody can read back
 * over the phone is no use to the shop. Those are set in the admin's sans.
 */
export function AdminHeading({
  title,
  standfirst,
  action,
  identifier = false,
}: {
  title: string;
  standfirst?: string;
  action?: React.ReactNode;
  identifier?: boolean;
}) {
  return (
    <div className="mb-[clamp(20px,2.6vw,32px)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div>
        <h1
          className={cn(
            "m-0 leading-[1.06] text-champagne",
            identifier
              ? "font-admin text-[clamp(24px,3vw,34px)] font-semibold tracking-[0.01em] tabular-nums"
              : "font-display font-normal text-[clamp(26px,3.4vw,40px)] tracking-[0.02em] uppercase",
          )}
        >
          {title}
        </h1>
        {standfirst && (
          <p className="mt-3 mb-0 max-w-[68ch] text-[14.5px] leading-[1.65] text-taupe">
            {standfirst}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Dates and times are always the shop's — Dubai — not the server's. */
export function adminDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SHOP_TZ,
  });
}

export function adminDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TZ,
  });
}
