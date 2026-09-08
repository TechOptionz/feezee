export const site = {
  name: "FEEZEE",
  title: "FEEZEE Fashion — Embroidered Kurtas, Luxury Pret & Made-to-Order Silai",
  description:
    "FEEZEE Fashion — embroidered kurtas, luxury pret and made-to-order silai for women, delivered across Dubai and all 7 Emirates, and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * The bare host, for copy that reads the address aloud — "check it any time at
 * feezee.ae/track-order".
 *
 * Derived from `site.url` so it is never out of step with where the shop
 * actually lives, but never "localhost:3000" in an email either: a development
 * origin falls back to the real domain, because the sentence is about where the
 * customer goes, not where the mail was generated.
 */
export const siteHost = (() => {
  const fallback = "feezee.ae";
  try {
    const { hostname, host } = new URL(site.url);
    if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return fallback;
    }
    return host.replace(/^www\./, "");
  } catch {
    return fallback;
  }
})();

/**
 * Where a customer goes to watch their parcel, with the one thing the page
 * asks for already filled in.
 *
 * One definition, because it is written into the confirmation email, the
 * dispatch email and the receipt page, and a tracking link that works in two
 * of those three is worse than none.
 *
 * The order number is the only parameter. Tracking does not require the email,
 * so putting one in the link would buy nothing and cost a customer's address
 * appearing in their browser history, in a `Referer` header and in the server's
 * access log.
 *
 * `trackOrderPath` is the in-app link (a `<Link href>`); `trackOrderUrl` is the
 * absolute one an email needs.
 */
export function trackOrderPath(orderNumber: string): string {
  return `/track-order?${new URLSearchParams({ order: orderNumber })}`;
}

export function trackOrderUrl(orderNumber: string): string {
  return `${site.url}${trackOrderPath(orderNumber)}`;
}

/**
 * The shop itself — the details printed on its invoices.
 *
 * One source for every place the site says how to reach FEEZEE: the footer,
 * the "WhatsApp Us" link in the nav, the Silai order band and the chat
 * widget's fallback. `whatsapp.e164` is the number without its plus or its
 * spaces, which is the only form `wa.me` accepts; `whatsapp.display` is the
 * same number written the way it is read aloud.
 */
export const contact = {
  legalName: "FEEZEE SILAI FASHION L.L.C",
  email: "feezeesilai@gmail.com",
  whatsapp: {
    e164: "971582279302",
    display: "+971 58 227 9302",
  },
  address: {
    /** One line per line of the printed address, for a <address> block. */
    lines: [
      "Shop No. 1-35, First Floor",
      "Madina Mall, Al Muhaisnah 4",
      "Dubai, United Arab Emirates",
    ],
    /** The same address on one line, for maps and metadata. */
    oneLine:
      "Shop No. 1-35, First Floor, Madina Mall, Al Muhaisnah 4, Dubai, United Arab Emirates",
  },
  hours: "10am – 8pm, Monday to Saturday",
} as const;

/**
 * A `wa.me` link to the shop, optionally opening the chat with a message
 * already typed — so a visitor who presses a button on a product or the Silai
 * band does not have to explain where they came from.
 */
export function whatsappHref(message?: string) {
  const base = `https://wa.me/${contact.whatsapp.e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Google Maps, searched by name and address rather than by a pinned ID. */
export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${contact.legalName}, ${contact.address.oneLine}`,
)}`;

/**
 * Store settings. These were editor-controlled props on the source design
 * (`currency`, `showAnnouncement`); here they are build-time configuration.
 */
export const storeConfig = {
  showAnnouncement: true,
  freeShippingThresholdAed: 1000,
} as const;
