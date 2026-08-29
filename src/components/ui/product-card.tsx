"use client";

import Image from "next/image";
import { useStore } from "@/components/store/store-provider";
import type { Product } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * Tailwind needs the finished class name, so the ratios a card can take are
 * spelled out here rather than interpolated from the prop.
 */
const RATIO = {
  "4/5": "aspect-[4/5]",
  "2/3": "aspect-[2/3]",
} as const;

export function ProductCard({
  product,
  ratio = "4/5",
  sizes = "(max-width: 860px) 74vw, 25vw",
}: {
  product: Product;
  /** Crop of the photo. Category tiles run taller than the drop rail. */
  ratio?: keyof typeof RATIO;
  /** Rendered width of the tile, for the responsive image srcset. */
  sizes?: string;
}) {
  const { currency, wished, toggleWish, addToBag } = useStore();
  const isWished = Boolean(wished[product.id]);

  return (
    <div className="group flex flex-col">
      <div className={cn("relative overflow-hidden bg-sand", RATIO[ratio])}>
        <Image
          src={img(product.img)}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 text-cream text-[10px] tracking-[0.14em] uppercase px-[9px] py-1",
              product.badge.tone === "wine" ? "bg-wine" : "bg-gold",
            )}
          >
            {product.badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWished}
          className={cn(
            "absolute top-2 right-2 w-[38px] h-[38px] border-none rounded-full bg-cream/92 cursor-pointer text-base flex items-center justify-center",
            isWished ? "text-wine" : "text-ink",
          )}
        >
          {isWished ? "♥" : "♡"}
        </button>
        {/*
          The tile reads as an editorial image until it is pointed at; the bag
          bar rides in over the bottom edge. `group-focus-within` keeps it
          reachable by keyboard, and on touch it simply stays put.
        */}
        <button
          type="button"
          onClick={addToBag}
          aria-label={`Add ${product.name} to bag`}
          className="absolute inset-x-0 bottom-0 bg-cream/95 text-ink py-3 text-[11px] tracking-[0.18em] uppercase cursor-pointer translate-y-full opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
        >
          Add to Bag
        </button>
      </div>

      <div className="pt-3.5 px-3 flex flex-col items-center gap-[5px] text-center">
        <div className="text-[12px] tracking-[0.18em] uppercase">{product.name}</div>
        <div className="text-[11.5px] text-muted tracking-[0.06em]">{product.fabric}</div>
        <div className="flex gap-2 items-baseline">
          <span className="text-[13.5px] font-medium">{formatPrice(product.pkr, currency)}</span>
          {product.wasPkr && (
            <span className="text-[12px] text-muted line-through">
              {formatPrice(product.wasPkr, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
