export const site = {
  name: "FEEZEE",
  title: "FEEZEE Fashion — Embroidered Kurtas, Luxury Pret & Made-to-Order Silai",
  description:
    "FEEZEE Fashion — embroidered kurtas, luxury pret and made-to-order silai for women, shipped nationwide and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Store settings. These were editor-controlled props on the source design
 * (`currency`, `showAnnouncement`); here they are build-time configuration.
 */
export const storeConfig = {
  showAnnouncement: true,
  freeShippingThresholdPkr: 5000,
} as const;
