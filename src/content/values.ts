import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";

/**
 * The four promises on the rule at the foot of every page.
 *
 * FEEZEE is a Dubai house — the workshop and the boutique are both at Madina
 * Mall, Al Muhaisnah 4 — so these say the UAE, not a nationwide delivery that
 * belongs to a different country. The free-delivery figure is read off
 * `storeConfig` rather than typed here, because the announcement bar, the
 * chat assistant and the checkout all quote the same number and only one of
 * them is allowed to be the source of it.
 */
export type ValueProp = { title: string; text: string };

export const values: ValueProp[] = [
  {
    title: "Stitched in Dubai",
    text: "Cut and finished by our own tailors at Madina Mall",
  },
  { title: "Free Alterations", text: "Every silai order, altered until it fits" },
  {
    title: "Cash on Delivery",
    text: "Pay at your door, anywhere in the UAE",
  },
  {
    title: "Delivery Across the UAE",
    text: `Fast delivery across Dubai and all 7 Emirates — free over ${formatPrice(
      storeConfig.freeShippingThresholdAed,
    )}`,
  },
];
