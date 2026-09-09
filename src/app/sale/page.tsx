import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { CollectionHeader } from "@/components/shop/collection-header";
import { CollectionNote } from "@/components/shop/collection-note";
import { LineStrip } from "@/components/shop/line-strip";
import { shopPage } from "@/content/collections";
import { productsForShopPage } from "@/modules/catalogue/collections";
import { discountPct } from "@/content/products";
import { newInProducts } from "@/modules/catalogue";
import { formatPrice } from "@/lib/currency";

const page = shopPage("/sale")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default async function SalePage() {
  const products = await productsForShopPage(page);
  const fullPriceCount = (await newInProducts()).length;

  /*
   * The three numbers a sale page is actually asked for. They are read off the
   * marked-down stock rather than typed into the copy, so a price change here
   * can never leave the banner claiming a discount that no longer exists.
   *
   * Spread over an empty list, `Math.max` returns -Infinity and `Math.min`
   * returns Infinity — a banner reading "up to -Infinity% off". Now that a
   * piece leaves this page the moment a buyer ends its reduction, an empty
   * sale is an ordinary Tuesday rather than a hypothetical, so both are
   * guarded.
   */
  const deepest = products.length
    ? Math.max(...products.map((p) => discountPct(p) ?? 0))
    : 0;
  const cheapest = products.length
    ? Math.min(...products.map((p) => p.aed))
    : 0;
  const saving = products.reduce(
    (sum, p) => sum + ((p.wasAed ?? p.aed) - p.aed),
    0,
  );

  return (
    <PageFrame>
      {/*
        A wine band across the top, before the breadcrumb does its usual job.
        The sale is the reason anyone is on this page, so it gets stated before
        the navigation furniture rather than after it.
      */}
      <section className="bg-wine text-cream">
        <div className="max-w-[var(--fz-container)] mx-auto px-[18px] py-[clamp(22px,3vw,34px)] flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <p className="m-0 font-display text-[clamp(20px,2.6vw,30px)] leading-[1.15]">
            End of season — up to {deepest}% off
          </p>
          {/*
            Three figures of very different label lengths: wrapping put two on
            one line and orphaned the third under the wider of them. On a phone
            they take a row of three equal columns instead, so the numbers line
            up whatever the words above them do.
          */}
          <dl className="m-0 grid grid-cols-3 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-[clamp(24px,4vw,56px)] text-[13px] tracking-[0.14em] uppercase">
            <div className="grid grid-rows-subgrid row-span-2 gap-1 sm:flex sm:flex-col">
              <dt className="text-cream/70">Pieces reduced</dt>
              <dd className="m-0 text-[15px] tracking-[0.08em]">
                {products.length}
              </dd>
            </div>
            <div className="grid grid-rows-subgrid row-span-2 gap-1 sm:flex sm:flex-col">
              <dt className="text-cream/70">From</dt>
              <dd className="m-0 text-[15px] tracking-[0.08em]">
                {formatPrice(cheapest)}
              </dd>
            </div>
            <div className="grid grid-rows-subgrid row-span-2 gap-1 sm:flex sm:flex-col">
              <dt className="text-cream/70">Total off the rail</dt>
              <dd className="m-0 text-[15px] tracking-[0.08em]">
                {formatPrice(saving)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <CollectionHeader page={page} count={products.length} />
      <CollectionGrid products={products} />
      <CollectionNote page={page} />
      {/* A reduced piece keeps its place on its own line's page, so this is a
          way *into* the lines rather than a rail of pieces that are only here.
          The count is the whole rail across the three lines, reduced or not. */}
      <LineStrip
        heading="Shop the lines"
        standfirst={`Every reduction above also hangs on its own line. The ${fullPriceCount} pieces on the rail are split across these three.`}
      />
    </PageFrame>
  );
}
