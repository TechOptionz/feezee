"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit-logs", label: "Audit log" },
] as const;

/**
 * The sidebar. A client component only because it needs `usePathname` to know
 * which entry to mark — everything it renders is static.
 *
 * `/admin` is matched exactly; every other entry matches its whole subtree, so
 * an order's own page keeps "Orders" lit.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-x-1 gap-y-0 overflow-x-auto px-3 pb-3 nav:flex-col nav:overflow-visible nav:px-3 nav:py-2"
    >
      {LINKS.map((link) => {
        const here =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={here ? "page" : undefined}
            className={cn(
              "whitespace-nowrap px-3 py-2.5 text-[12.5px] tracking-[0.14em] uppercase transition-colors",
              here
                ? "bg-ink-line/60 text-champagne hover:text-champagne"
                : "text-taupe hover:text-champagne",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
