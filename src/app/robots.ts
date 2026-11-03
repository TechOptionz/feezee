import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * `/robots.txt`.
 *
 * Crawlers may read the shop; they may not read anyone's account, a checkout
 * in progress, an order receipt or the API underneath them. None of those
 * pages have anything to rank, and the receipt and account pages hold
 * personal details that must never appear in a search result.
 *
 * The back office is not listed: it lives on its own host, sends
 * `X-Robots-Tag: noindex` there, and naming it here would only advertise it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/checkout/",
        "/order-confirmation/",
        "/api/",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
