"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shopPages } from "@/content/collections";
import { cn } from "@/lib/utils";

/**
 * The row of sister collections that sits under the page title, the way a
 * department store hangs its other rails off the one you are standing at. The
 * page you are on is set in ink and holds its rule; the rest are muted.
 *
 * Below the nav breakpoint it scrolls sideways rather than wrapping, so the
 * five names stay on one line at every width.
 */
export function ShopSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Collections"
      className="no-scrollbar -mx-[18px] flex items-center gap-x-[clamp(18px,2.4vw,36px)] overflow-x-auto px-[18px] nav:mx-0 nav:px-0"
    >
      {shopPages.map((page) => {
        const here = pathname === page.slug;
        return (
          <Link
            key={page.slug}
            href={page.slug}
            aria-current={here ? "page" : undefined}
            className={cn(
              /* Most of the extra height a thumb needs is taken above the word,
                 so the rule underneath still reads as hung off it. */
              "relative shrink-0 whitespace-nowrap pt-3 pb-2 nav:py-1",
              "text-[clamp(13.5px,1vw,15px)] tracking-[0.18em] uppercase",
              "after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-px",
              "after:bg-current after:transition-[width] after:duration-300",
              here
                ? "after:w-full"
                : "after:w-0 hover:after:w-full focus-visible:after:w-full",
              page.tone === "sale"
                ? "text-wine hover:text-wine"
                : here
                  ? "text-ink hover:text-ink"
                  : "text-muted hover:text-ink",
            )}
          >
            {page.nav}
          </Link>
        );
      })}
    </nav>
  );
}
