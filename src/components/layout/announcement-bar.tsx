import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * `overlay` is the state where the bar floats over the hero photograph: no
 * band, just light type, so nothing crosses the picture.
 */
export function AnnouncementBar({ overlay = false }: { overlay?: boolean }) {
  if (!storeConfig.showAnnouncement) return null;

  return (
    <div
      className={cn(
        "text-center text-[13px] tracking-[0.16em] uppercase px-4 py-[11px] transition-colors duration-500",
        overlay ? "bg-transparent text-cream/90" : "bg-ink text-champagne",
      )}
    >
      Free nationwide delivery on orders over{" "}
      {formatPrice(storeConfig.freeShippingThresholdPkr)}
    </div>
  );
}
