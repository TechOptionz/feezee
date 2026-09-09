import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { Values } from "@/components/sections/values";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { CollectionHeader } from "@/components/shop/collection-header";
import { CollectionNote } from "@/components/shop/collection-note";
import { MadeToOrderBand } from "@/components/shop/made-to-order-band";
import { ProductRail } from "@/components/shop/product-rail";
import { shopPage } from "@/content/collections";
import { productsForShopPage } from "@/modules/catalogue/collections";
import { saleProducts } from "@/modules/catalogue";

const page = shopPage("/printed-lawn")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default async function PrintedLawnPage() {
  const [products, reduced] = await Promise.all([
    productsForShopPage(page),
    saleProducts(),
  ]);

  /*
   * Everything reduced that this page has not already shown.
   *
   * A marked-down lawn print now stays in the grid above with its own
   * strikethrough rather than being carried off to the sale page, so a rail of
   * "reduced lawn" would be four cards the reader just scrolled past. What is
   * worth a rail is the reductions on the other lines — which is why the copy
   * no longer promises prints.
   */
  const shown = new Set(products.map((p) => p.id));
  const elsewhere = reduced.filter((p) => !shown.has(p.id)).slice(0, 4);

  return (
    <PageFrame>
      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid products={products} />
      <CollectionNote page={page} />
      <ProductRail
        heading="Already reduced"
        standfirst="Last season across the other lines, marked down while the sizes last."
        products={elsewhere}
        viewAll={{ href: "/sale", label: "View all sale" }}
      />
      {/* Lawn is bought by the lot and cut to order more often than anything
          else on the site, so this band earns its place at the foot. */}
      <MadeToOrderBand line="Buying lawn to have it stitched your way?" />
      <Values />
    </PageFrame>
  );
}
