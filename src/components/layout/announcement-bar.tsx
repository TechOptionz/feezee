import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";

export function AnnouncementBar() {
  if (!storeConfig.showAnnouncement) return null;

  return (
    <div className="bg-ink text-champagne text-center text-xs tracking-[0.14em] uppercase px-4 py-[9px]">
      Free nationwide delivery on orders over{" "}
      {formatPrice(storeConfig.freeShippingThresholdPkr)}
    </div>
  );
}
