import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { Lookbook } from "@/components/sections/lookbook";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { CollectionHeader } from "@/components/shop/collection-header";
import { CollectionNote } from "@/components/shop/collection-note";
import { MadeToOrderBand } from "@/components/shop/made-to-order-band";
import { ProductRail } from "@/components/shop/product-rail";
import { productsForPage, shopPage } from "@/content/collections";
import { productsInCollection } from "@/content/products";

const page = shopPage("/luxury-pret")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default function LuxuryPretPage() {
  const products = productsForPage(page);

  return (
    <PageFrame>
      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid products={products} />
      <CollectionNote page={page} />
      {/* Occasion wear is where a made-to-measure order is most likely to be
          worth the wait, so the Silai band sits directly under the copy. */}
      <MadeToOrderBand line="Want this cut for a wedding date?" />
      <ProductRail
        heading="Wear it before the occasion"
        standfirst="Lighter prints from the same season, for the days between the events."
        products={productsInCollection("Printed Lawn").slice(0, 4)}
        viewAll={{ href: "/printed-lawn", label: "View all printed lawn" }}
      />
      <Lookbook />
    </PageFrame>
  );
}
