"use client";

import Link from "next/link";
import { useStore } from "@/components/store/store-provider";
import { ProductCard } from "@/components/ui/product-card";
import { formatPrice } from "@/lib/currency";
import type { ProductView } from "@/modules/catalogue";

/**
 * Everything hearted, from any page. The tiles are the same ones the shop grids
 * use, so un-hearting a piece here removes it from the page under your finger —
 * which is the behaviour a wishlist should have.
 *
 * Where the saved ids come from depends on who is asking: the database for a
 * signed-in customer, `localStorage` for a guest. The store settles that, and
 * `wishReady` is how it says it has finished settling it.
 *
 * The catalogue arrives as a prop either way: what a saved piece is worth and
 * whether it is still on the rail is the database's to say, and a client
 * component cannot ask it directly.
 */
export function WishlistContents({ catalogue }: { catalogue: ProductView[] }) {
  const { wishedIds, currency, wishReady, addToBag } = useStore();

  const saved = wishedIds.flatMap((id) => {
    const found = catalogue.find((p) => p.id === id);
    return found ? [found] : [];
  });

  // Nothing honest to draw until the saved list has been read back — from the
  // browser for a guest, and from the database for anyone signed in.
  if (!wishReady) return <div className="min-h-[40vh]" />;

  if (saved.length === 0) {
    return (
      <div className="py-[clamp(40px,7vw,90px)] text-center">
        <p className="m-0 font-display text-[clamp(22px,3vw,32px)]">
          Nothing saved yet.
        </p>
        <p className="mt-3 mb-7 text-[15px] text-cocoa max-w-[46ch] mx-auto">
          Tap the heart on any piece and it will wait for you here — on your
          account if you are signed in, on this device if you are not.
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
