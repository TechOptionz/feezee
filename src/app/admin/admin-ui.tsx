import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The admin's own vocabulary.
 *
 * The shop is cream and gold; the back office is ink and champagne. That is not
 * decoration — it is so that a screenshot, a bookmark or a glance at a laptop on
 * the shop counter tells you instantly which of the two you are looking at, and
 * nobody edits a price thinking they are browsing.
 */

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
        "border border-ink-line bg-ink/40 p-[clamp(16px,2.2vw,24px)]",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-line pb-3">
          {title && (
            <h2 className="m-0 text-[12.5px] tracking-[0.22em] uppercase font-normal text-champagne">
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
      <div className="text-[11.5px] tracking-[0.2em] uppercase text-taupe">
        {label}
      </div>
      <div
        className={cn(
          "mt-2.5 font-display text-[clamp(22px,2.6vw,32px)] leading-none",
          tone === "warn" ? "text-wine-bright" : "text-champagne",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-[12px] text-taupe">{hint}</div>}
    </>
  );

  const className = cn(
    "block border p-[clamp(16px,2.2vw,22px)] transition-colors",
    tone === "warn" ? "border-wine/45 bg-wine/10" : "border-ink-line bg-ink/40",
    href && "hover:border-gold",
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
          : "border-ink-border text-taupe bg-transparent";

  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase whitespace-nowrap",
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
        "whitespace-nowrap border-b border-ink-line py-2.5 pr-5 text-[11px] tracking-[0.16em] uppercase font-normal text-taupe",
        align === "right" && "text-right pr-0",
      )}
    >
      {children}
    </th>
  );
}

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
        "border-b border-ink-line/60 py-3 pr-5 text-[13.5px] text-sandstone align-top",
        align === "right" && "text-right pr-0 tabular-nums",
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

export function AdminHeading({
  title,
  standfirst,
  action,
}: {
  title: string;
  standfirst?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-[clamp(20px,2.6vw,32px)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div>
        <h1 className="m-0 font-display font-normal text-[clamp(26px,3.4vw,40px)] leading-[1.06] uppercase text-champagne">
          {title}
        </h1>
        {standfirst && (
          <p className="mt-2.5 mb-0 max-w-[68ch] text-[14px] leading-[1.7] text-taupe">
            {standfirst}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function adminDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function adminDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
