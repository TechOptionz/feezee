import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { Values } from "@/components/sections/values";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { CollectionHeader } from "@/components/shop/collection-header";
import { CollectionNote } from "@/components/shop/collection-note";
import { LineStrip } from "@/components/shop/line-strip";
import { MadeToOrderBand } from "@/components/shop/made-to-order-band";
import { productsForPage, shopPage } from "@/content/collections";

const page = shopPage("/new-in")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

/**
 * Every piece across the three lines, in one grid. `?category=` lets the home
 * page's "Shop by Category" tabs hand a category straight over, so "View all
 * kurtas" arrives here with Kurtas already ticked.
 */
export default async function NewInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await searchParams;
  const products = productsForPage(page);

  return (
    <PageFrame>
      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid
        products={products}
        initialCategory={typeof category === "string" ? category : undefined}
      />
      <LineStrip standfirst="New In is the three lines put together. Here they are on their own, if you already know what you came for." />
      <CollectionNote page={page} />
      <MadeToOrderBand line="Seen something here you want cut to your own measurements?" />
      <Values />
    </PageFrame>
  );
}
