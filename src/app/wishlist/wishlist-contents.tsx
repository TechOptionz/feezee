"use client";

import Link from "next/link";
import { useStore } from "@/components/store/store-provider";
import { ProductCard } from "@/components/ui/product-card";
import { productsByIds } from "@/content/products";
import { formatPrice } from "@/lib/currency";

/**
 * Everything hearted, from any page, kept in the browser. The tiles are the
 * same ones the shop grids use, so un-hearting a piece here removes it from
 * the page under your finger — which is the behaviour a wishlist should have.
 */
export function WishlistContents() {
  const { wishedIds, currency, hydrated, addToBag } = useStore();
  const saved = productsByIds(wishedIds);

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

  const total = saved.reduce((sum, product) => sum + product.pkr, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-4">
        <span className="text-[13px] tracking-[0.14em] uppercase text-muted">
          {saved.length} {saved.length === 1 ? "piece" : "pieces"} saved ·{" "}
          {formatPrice(total, currency)}
        </span>
        {/* Wrapped, this has a line to itself, so it takes the width of it
            rather than stopping short of the right edge. */}
        <button
          type="button"
          onClick={() => saved.forEach((product) => addToBag(product.id))}
          className="w-full sm:w-auto bg-ink text-cream border-none cursor-pointer px-6 py-3.5 sm:py-3 text-[12.5px] tracking-[0.16em] uppercase"
        >
          Add all to bag
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
