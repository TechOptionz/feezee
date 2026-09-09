import "server-only";
import {
  allProducts,
  newInProducts,
  productsInCollection,
  saleProducts,
  type ProductView,
} from "@/modules/catalogue";
import type { ShopPage } from "@/content/collections";
import { boutiqueRail, newArrivalGroups } from "@/content/products";
import type { Collection } from "@/content/products";

/**
 * The bridge between the design's curation and the database's stock.
 *
 * `content/` still decides what a page is *about* — which lines New In gathers,
 * which garments open the "New This Week" tab, the order the boutique rail
 * hangs in. That is editorial, it was designed, and it does not belong in a
 * table. What it must not decide any more is the price or whether a piece is
 * still for sale, so every one of these resolves the curation against live rows
 * and quietly drops anything that has been archived.
 */

/**
 * The garments a shop page shows.
 *
 * Three of the five pages are a line and resolve to one; the other two are
 * cross-cuts of the catalogue. New In gathers the three lines. Sale gathers
 * whatever is reduced, wherever it hangs — which is why a piece can be on both
 * its line's page and this one at the same time, exactly as it is in the shop,
 * where a reduced kurta stays on the rail with a ticket on it rather than being
 * carried off to a different room.
 */
export function productsForShopPage(page: ShopPage): Promise<ProductView[]> {
  if (page.slug === "/new-in") return newInProducts();
  if (page.slug === "/sale") return saleProducts();
  return productsInCollection(page.nav as Collection);
}

export type BoutiqueEntry = { product: ProductView; img: string };

/**
 * The boutique rail that closes the home page — the hanger frames, in the
 * colour order the design set, each resolved to a live garment.
 */
export async function boutiqueLooks(): Promise<BoutiqueEntry[]> {
  const products = await allProducts();
  const byId = new Map(products.map((p) => [p.id, p]));

  return boutiqueRail.flatMap(({ productId, img }) => {
    const product = byId.get(productId);
    return product ? [{ product, img }] : [];
  });
}

export type ArrivalGroup = {
  name: string;
  blurb: string;
  href: string;
  products: ProductView[];
  /** How many pieces the line holds altogether, for the count above the tabs. */
  lineSize: number;
};

/** The "New Arrivals" tabs on the home page, filled from live stock. */
export async function newArrivalTabs(): Promise<ArrivalGroup[]> {
  const products = await allProducts();
  const byId = new Map(products.map((p) => [p.id, p]));

  return newArrivalGroups.map((group) => ({
    name: group.name,
    blurb: group.blurb,
    href: group.href,
    products: group.productIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
    lineSize: products.filter((p) => p.collection === group.name).length,
  }));
}

/** Every garment, for surfaces that filter client-side (wishlist, assistant). */
export function catalogueForClient(): Promise<ProductView[]> {
  return allProducts();
}
