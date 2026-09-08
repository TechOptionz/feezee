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
import { productsInCollection } from "@/content/products";

const page = shopPage("/printed-lawn")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default async function PrintedLawnPage() {
  const products = await productsForShopPage(page);

  return (
    <PageFrame>
      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid products={products} />
      <CollectionNote page={page} />
      <ProductRail
        heading="Still printed, already reduced"
        standfirst="Last season's prints, marked down while the sizes last."
        products={productsInCollection("Sale").slice(0, 4)}
        viewAll={{ href: "/sale", label: "View all sale" }}
      />
      {/* Lawn is bought by the lot and cut to order more often than anything
          else on the site, so this band earns its place at the foot. */}
      <MadeToOrderBand line="Buying lawn to have it stitched your way?" />
      <Values />
    </PageFrame>
  );
}
