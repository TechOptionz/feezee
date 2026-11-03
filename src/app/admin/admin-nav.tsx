"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminPath } from "@/app/admin/admin-path";
import { stripAdminPrefix } from "@/lib/admin-host";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
  { href: "/orders", label: "Orders" },
  { href: "/returns", label: "Returns" },
  { href: "/customers", label: "Customers" },
  { href: "/reports", label: "Reports" },
  { href: "/audit-logs", label: "Audit log" },
  { href: "/account", label: "My account" },
] as const;

/**
 * The sidebar. A client component only because it needs `usePathname` to know
 * which entry to mark — everything it renders is static.
 *
 * The dashboard is matched exactly; every other entry matches its whole
 * subtree, so an order's own page keeps "Orders" lit. The pathname is compared
 * without the `/admin` prefix, so the same test holds on the admin host and on
 * a deploy preview.
 *
 * The entry you are on gets a raised ground and a gold rule: along its left
 * edge in the sidebar, along its bottom edge when the nav is a row on a phone.
 */
export function AdminNav() {
  const pathname = stripAdminPrefix(usePathname());
  const adminPath = useAdminPath();

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-x-1 gap-y-0 overflow-x-auto px-3 pb-3 nav:flex-col nav:gap-y-0.5 nav:overflow-visible nav:px-3 nav:py-2"
    >
      {LINKS.map((link) => {
        const here =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={adminPath(link.href)}
            aria-current={here ? "page" : undefined}
            className={cn(
              "whitespace-nowrap px-3 py-2.5 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors",
              here
                ? "bg-admin-raised text-champagne shadow-[inset_0_-2px_0_0_var(--fz-gold)] nav:shadow-[inset_2px_0_0_0_var(--fz-gold)] hover:text-champagne"
                : "text-taupe hover:bg-admin-surface hover:text-champagne",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
