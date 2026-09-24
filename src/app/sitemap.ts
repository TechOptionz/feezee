import type { MetadataRoute } from "next";
import { articleHref, articles } from "@/content/journal";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

/**
 * `/sitemap.xml`.
 *
 * Every page a search engine should find, in three groups: the shop pages,
 * which change as stock moves; the garments, one URL per product the database
 * still sells; and the pages that explain the shop — policies and the journal —
 * which change when someone rewrites them and not otherwise.
 *
 * Regenerated on the hour so a garment created in the admin is in the sitemap
 * the same afternoon, without hitting the database on every crawler request.
 */
export const revalidate = 3600;

const url = (path: string) => `${site.url}${path}`;

/** The home page and the collection pages, in nav order. */
const shopRoutes = [
  "/",
  "/new-in",
  "/ready-to-wear",
  "/luxury-pret",
  "/printed-lawn",
  "/sale",
  "/silai",
];

/** Policies and information — indexed, but rarely rewritten. */
const infoRoutes = ["/shipping-and-returns", "/privacy-policy", "/terms"];

/**
 * Every product still on sale, with the time it was last edited so a crawler
 * knows which pages to revisit. Archived garments are left out: their pages
 * 404, and a sitemap that lists dead URLs is trusted less as a whole.
 *
 * Falls back to an empty list if the database is unreachable, so the static
 * routes are still served rather than a 500.
 */
async function productEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return products.map((product) => ({
      url: url(`/product/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const shop: MetadataRoute.Sitemap = shopRoutes.map((path) => ({
    url: url(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.9,
  }));

  const info: MetadataRoute.Sitemap = infoRoutes.map((path) => ({
    url: url(path),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const journal: MetadataRoute.Sitemap = articles.map((article) => ({
    url: url(articleHref(article)),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...shop, ...(await productEntries()), ...info, ...journal];
}
