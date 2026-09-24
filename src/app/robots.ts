import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * `/robots.txt`.
 *
 * Crawlers may read the shop; they may not read anyone's account, the admin,
 * a checkout in progress, an order receipt or the API underneath them. None of
 * those pages have anything to rank, and the receipt and account pages hold
 * personal details that must never appear in a search result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/checkout/",
        "/order-confirmation/",
        "/api/",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
