import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { CollectionHeader } from "@/components/shop/collection-header";
import { CollectionNote } from "@/components/shop/collection-note";
import { LineStrip } from "@/components/shop/line-strip";
import { productsForPage, shopPage } from "@/content/collections";
import { discountPct, newInProducts } from "@/content/products";
import { formatPrice } from "@/lib/currency";

const page = shopPage("/sale")!;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default function SalePage() {
  const products = productsForPage(page);

  /*
   * The three numbers a sale page is actually asked for. They are read off the
   * marked-down stock rather than typed into the copy, so a price change here
   * can never leave the banner claiming a discount that no longer exists.
   */
  const deepest = Math.max(...products.map((p) => discountPct(p) ?? 0));
  const cheapest = Math.min(...products.map((p) => p.aed));
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
      {/* Nothing on this page is in New In — by construction, since a garment
          belongs to exactly one line — so the way back to full price is a link
          to the lines rather than a rail of the same pieces again. */}
      <LineStrip
        heading="Back to full price"
        standfirst={`Sale is last season. The ${newInProducts().length} pieces currently on the rail are split across these three lines.`}
      />
    </PageFrame>
  );
}
