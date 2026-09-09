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
import { productsInCollection } from "@/modules/catalogue";

const page = shopPage("/ready-to-wear")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default async function ReadyToWearPage() {
  const [products, pret] = await Promise.all([
    productsForShopPage(page),
    productsInCollection("Luxury Pret"),
  ]);

  return (
    <PageFrame>
      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid products={products} />
      <CollectionNote page={page} />
      {/* Ready to Wear is the standard-size rail, so the obvious next question
          is what happens when a standard size will not do. */}
      <MadeToOrderBand line="Between sizes, or want a longer shirt?" />
      <ProductRail
        heading="Dress it up"
        standfirst="The occasion pieces that go over the same trousers — hand-finished, dupatta included."
        products={pret.slice(0, 4)}
        viewAll={{ href: "/luxury-pret", label: "View all luxury pret" }}
      />
      <Values />
    </PageFrame>
  );
}
