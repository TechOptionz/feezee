import { ProductCard } from "@/components/ui/product-card";
import { ViewAll } from "@/components/ui/view-all";
import type { Product } from "@/content/products";

/**
 * A short rail of four pieces from somewhere other than the page you are on —
 * the sale page's way of showing what full price looks like, and a line page's
 * way of showing what else landed the same week.
 *
 * It scrolls sideways on a phone instead of stacking into a second grid, so it
 * never competes with the page's own grid for attention.
 */
export function ProductRail({
  heading,
  standfirst,
  products,
  viewAll,
}: {
  heading: string;
  standfirst?: string;
  products: Product[];
  viewAll?: { href: string; label: string };
}) {
  if (products.length === 0) return null;

  return (
    <section className="pt-[clamp(44px,7vw,90px)]">
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        <h2 className="font-display font-normal text-[clamp(26px,3.6vw,40px)] leading-[1.1] m-0">
          {heading}
        </h2>
        {standfirst && (
          <p className="mt-3 mb-0 max-w-[60ch] text-[15px] leading-[1.7] text-cocoa">
            {standfirst}
          </p>
        )}
      </div>

      {/*
        Scrolling, the cards used to butt against each other and against the
        left edge of the window, so two garments shared a seam and the first
        one started off the page's own margin. The rail keeps the margin as
        scroll padding and puts a gutter between the cards; the last one still
        bleeds off the right edge to say there is more of it. From `nav` up it
        is the four-column grid again, edge to edge as the design draws it.
      */}
      <div className="no-scrollbar mt-[clamp(22px,3vw,36px)] flex gap-x-[14px] snap-x px-[18px] [scroll-padding-inline:18px] overflow-x-auto nav:grid nav:grid-cols-4 nav:gap-x-0 nav:px-0 nav:overflow-visible">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[62vw] max-w-[280px] shrink-0 snap-start nav:w-auto nav:max-w-none nav:shrink"
          >
            <ProductCard
              product={product}
              ratio="2/3"
              sizes="(max-width: 860px) 62vw, 25vw"
            />
          </div>
        ))}
      </div>

      {viewAll && (
        <div className="max-w-[var(--fz-container)] mx-auto px-[18px] mt-[clamp(22px,2.8vw,32px)] text-center">
          <ViewAll href={viewAll.href}>{viewAll.label}</ViewAll>
        </div>
      )}
    </section>
  );
}
