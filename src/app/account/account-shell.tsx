import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { logoutAction } from "@/app/actions/account";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/addresses", label: "Addresses" },
] as const;

/**
 * The frame every signed-in account page shares: the heading, the four tabs,
 * and the way out.
 *
 * `current` is passed in rather than read from `usePathname`, so the whole
 * shell stays a server component — a client boundary here would drag every
 * account page's data into the browser bundle for the sake of underlining one
 * word.
 */
export function AccountShell({
  current,
  title,
  standfirst,
  name,
  children,
}: {
  current: string;
  title: string;
  standfirst?: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)] pb-[clamp(36px,5vw,72px)]">
        <Breadcrumb
          trail={
            current === "/account"
              ? ["Your account"]
              : [
                  { label: "Your account", href: "/account" },
                  NAV.find((n) => n.href === current)?.label ?? title,
                ]
          }
        />

        <div className="mt-[clamp(20px,3vw,34px)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="m-0 text-[12px] tracking-[0.3em] uppercase text-muted">
              {name}
            </p>
            <h1 className="mt-2 mb-0 font-display font-normal text-[clamp(32px,4.6vw,54px)] leading-[1.05] uppercase">
              {title}
            </h1>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="bg-transparent border border-line text-ink hover:border-ink cursor-pointer px-5 py-2.5 text-[12px] tracking-[0.16em] uppercase"
            >
              Sign out
            </button>
          </form>
        </div>

        {standfirst && (
          <p className="mt-4 mb-0 max-w-[62ch] text-[15px] leading-[1.7] text-cocoa">
            {standfirst}
          </p>
        )}

        <nav
          aria-label="Account"
          className="mt-[clamp(22px,3vw,34px)] flex flex-wrap gap-x-7 gap-y-2 border-b border-line"
        >
          {NAV.map((item) => {
            const here = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={here ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 pb-3 pt-1 text-[12.5px] tracking-[0.18em] uppercase",
                  here
                    ? "border-ink text-ink hover:text-ink"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-[clamp(26px,3.4vw,42px)]">{children}</div>
      </div>
    </PageFrame>
  );
}

/** The status chip used on every order and return row. */
export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "DELIVERED" || status === "PAID" || status === "REFUNDED"
      ? "border-gold/50 text-gold-dark bg-gold/5"
      : status === "CANCELLED" || status === "REJECTED" || status === "FAILED"
        ? "border-wine/40 text-wine bg-wine/5"
        : "border-line text-cocoa bg-panel";

  return (
    <span
      className={cn(
        "inline-block border px-3 py-1 text-[11.5px] tracking-[0.16em] uppercase whitespace-nowrap",
        tone,
      )}
    >
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

/** A short date, written the way a UAE invoice writes it. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
