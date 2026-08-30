import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ShopSubnav } from "@/components/shop/shop-subnav";
import type { ShopPage } from "@/content/collections";
import { cn } from "@/lib/utils";

/**
 * The top of every shop page: where you are, what the rail is called, the
 * sister rails, and a line of copy. Nothing below the subnav moves between
 * pages, so the five routes read as one shop rather than five microsites.
 */
export function CollectionHeader({
  page,
  count,
}: {
  page: ShopPage;
  /** Pieces on the rail — printed beside the eyebrow, not in the toolbar. */
  count: number;
}) {
  return (
    <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)]">
      <Breadcrumb trail={page.breadcrumb} />

      <p
        className={cn(
          "m-0 mt-[clamp(20px,3vw,34px)] flex items-center gap-3 text-[11.5px] tracking-[0.3em] uppercase",
          page.tone === "sale" ? "text-wine" : "text-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-px w-[clamp(22px,3vw,40px)]",
            page.tone === "sale" ? "bg-wine/60" : "bg-gold/70",
          )}
        />
        {page.eyebrow}
        <span aria-hidden className="text-line">
          ·
        </span>
        {count} {count === 1 ? "piece" : "pieces"}
      </p>

      <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(38px,6vw,68px)] leading-[1.02] uppercase tracking-[0.01em]">
        {page.title}
      </h1>

      <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 max-w-[68ch] text-[clamp(15px,1.05vw,16.5px)] leading-[1.7] text-cocoa">
        {page.intro}
      </p>

      <div className="mt-[clamp(24px,3vw,38px)] mb-[clamp(16px,2vw,26px)]">
        <ShopSubnav />
      </div>
    </div>
  );
}
