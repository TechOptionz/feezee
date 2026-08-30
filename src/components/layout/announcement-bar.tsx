import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * `overlay` is the state where the bar floats over the hero photograph: no
 * band, just light type, so nothing crosses the picture.
 */
export function AnnouncementBar({ overlay = false }: { overlay?: boolean }) {
  if (!storeConfig.showAnnouncement) return null;

  const threshold = formatPrice(storeConfig.freeShippingThresholdAed);

  return (
    <div
      className={cn(
        "text-center text-[14px] tracking-[0.16em] uppercase px-4 py-[11px] transition-colors duration-500",
        overlay ? "bg-transparent text-cream/90" : "bg-ink text-champagne",
      )}
    >
      {/*
        The bar sits inside a header that is fixed over the hero, so a second
        line here costs the same forty pixels on every screen of the page. The
        full sentence does not hold one line on a phone at this size, and the
        answer is to say it shorter rather than to set it smaller — the offer
        is the same either way.
      */}
      <span className="sm:hidden">Free delivery over {threshold}</span>
      <span className="hidden sm:inline">
        Free nationwide delivery on orders over {threshold}
      </span>
    </div>
  );
}
