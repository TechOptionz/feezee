import { whatsappHref } from "@/lib/site";

export type NavLink = { label: string; href: string; tone?: "sale" };

/**
 * The six words in the header. Five of them are shop pages built from
 * `collections.ts`; Silai is the made-to-order page, which is a route of its
 * own but not a collection, so it is absent from the shop sub-nav.
 *
 * The order matches `shopPages` in `content/collections.ts`, with Silai dropped
 * into the second group — the header splits this list three and three around
 * the centre channel, so moving an entry moves which side of the hero it sits on.
 */
export const primaryNav: NavLink[] = [
  { label: "New In", href: "/new-in" },
  { label: "Ready to Wear", href: "/ready-to-wear" },
  { label: "Luxury Pret", href: "/luxury-pret" },
  { label: "Printed Lawn", href: "/printed-lawn" },
  { label: "Silai — Made to Order", href: "/silai" },
  { label: "Sale", href: "/sale", tone: "sale" },
];

export const footerNav = {
  shop: [
    { label: "New In", href: "/new-in" },
    { label: "Ready to Wear", href: "/ready-to-wear" },
    { label: "Luxury Pret", href: "/luxury-pret" },
    { label: "Printed Lawn", href: "/printed-lawn" },
    { label: "Sale", href: "/sale" },
    { label: "Made to Order", href: "/silai" },
  ],
  help: [
    { label: "Your Bag", href: "/cart" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Size Guide", href: "/ready-to-wear" },
    { label: "Shipping & Returns", href: "/shipping-and-returns" },
    {
      label: "WhatsApp Us",
      href: whatsappHref("Hello FEEZEE, I have a question."),
    },
    { label: "Track Order", href: "/track-order" },
  ],
  /*
   * The formal pages, in their own column rather than mixed into Help.
   *
   * Help is where a customer goes with a question; this is where they go to
   * read what the shop has committed to. They are different errands, and a
   * privacy notice sitting between "Wishlist" and "Track Order" reads like one
   * more shortcut instead of a document with a date on it.
   */
  legal: [
    { label: "Shipping & Returns", href: "/shipping-and-returns" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ],
} as const;
