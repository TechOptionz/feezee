"use client";

import Link from "next/link";
import { useStore } from "@/components/store/store-provider";
import { ProductCard } from "@/components/ui/product-card";
import { formatPrice } from "@/lib/currency";
import type { ProductView } from "@/modules/catalogue";

/**
 * Everything hearted, from any page, kept in the browser. The tiles are the
 * same ones the shop grids use, so un-hearting a piece here removes it from the
 * page under your finger — which is the behaviour a wishlist should have.
 *
 * The catalogue arrives as a prop: the saved ids live in `localStorage`, but
 * what they are worth and whether they are still on the rail is the database's
 * to say, and a client component cannot ask it directly.
 */
export function WishlistContents({ catalogue }: { catalogue: ProductView[] }) {
  const { wishedIds, currency, hydrated, addToBag } = useStore();

  const saved = wishedIds.flatMap((id) => {
    const found = catalogue.find((p) => p.id === id);
    return found ? [found] : [];
  });

  // Nothing honest to draw until the saved list has been read back.
  if (!hydrated) return <div className="min-h-[40vh]" />;

  if (saved.length === 0) {
    return (
      <div className="py-[clamp(40px,7vw,90px)] text-center">
        <p className="m-0 font-display text-[clamp(22px,3vw,32px)]">
          Nothing saved yet.
        </p>
        <p className="mt-3 mb-7 text-[15px] text-cocoa max-w-[46ch] mx-auto">
          Tap the heart on any piece and it will wait for you here — on this
          device, for as long as you like.
        </p>
        <Link
          href="/new-in"
          className="bg-ink text-cream hover:text-cream px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
        >
          Shop New In
        </Link>
      </div>
    );
  }

  const total = saved.reduce((sum, product) => sum + product.aed, 0);
  const inStock = saved.filter((p) => p.variants.some((v) => v.stock > 0));

  /*
   * Bulk add takes the first size still on the rail for each piece, and the bag
   * row prints which one it took. That is a real choice made on someone's
   * behalf, so it is labelled as what it is rather than as a plain "add all".
   */
  const addAll = () => {
    for (const product of inStock) {
      const variant = product.variants.find((v) => v.stock > 0);
      if (!variant) continue;
      addToBag({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        fabric: product.fabric,
        image: product.img,
        size: variant.size,
        sku: variant.sku,
        unitPriceAed: variant.priceAed,
        ...(product.wasAed ? { wasAed: product.wasAed } : {}),
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-4">
        <span className="text-[13px] tracking-[0.14em] uppercase text-muted">
          {saved.length} {saved.length === 1 ? "piece" : "pieces"} saved ·{" "}
          {formatPrice(total, currency)}
        </span>
        <button
          type="button"
          onClick={addAll}
          disabled={inStock.length === 0}
          className="w-full sm:w-auto bg-ink text-cream border-none cursor-pointer px-6 py-3.5 sm:py-3 text-[12.5px] tracking-[0.16em] uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {inStock.length === 0
            ? "All sold out"
            : "Add first available size to bag"}
        </button>
      </div>

      <div className="mt-[clamp(24px,3vw,40px)] grid grid-cols-2 nav:grid-cols-4 gap-x-[14px] nav:gap-x-5 gap-y-10 nav:gap-y-9">
        {saved.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            ratio="2/3"
            sizes="(max-width: 860px) 47vw, 25vw"
          />
        ))}
      </div>
    </>
  );
}
