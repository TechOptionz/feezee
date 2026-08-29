"use client";

import Image from "next/image";
import { useStore } from "@/components/store/store-provider";
import type { Product } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { currency, wished, toggleWish, addToBag } = useStore();
  const isWished = Boolean(wished[product.id]);

  return (
    <div className="flex flex-col">
      <div className="group relative aspect-[3/4] overflow-hidden bg-sand">
        <Image
          src={img(product.img)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 320px"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span
            className={cn(
              "absolute top-2.5 left-2.5 text-cream text-[10px] tracking-[0.14em] uppercase px-[9px] py-1",
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
            "absolute top-1.5 right-1.5 w-[38px] h-[38px] border-none rounded-full bg-cream/92 cursor-pointer text-base flex items-center justify-center",
            isWished ? "text-wine" : "text-ink",
          )}
        >
          {isWished ? "♥" : "♡"}
        </button>
      </div>

      <div className="pt-2.5 px-0.5 flex flex-col gap-[3px]">
        <div className="text-[14.5px] tracking-[0.02em]">{product.name}</div>
        <div className="text-xs text-muted tracking-[0.06em]">{product.fabric}</div>
        <div className="flex gap-2 items-baseline">
          <span className="text-[14.5px] font-medium">{formatPrice(product.pkr, currency)}</span>
          {product.wasPkr && (
            <span className="text-[12.5px] text-muted line-through">
              {formatPrice(product.wasPkr, currency)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={addToBag}
          className="mt-[7px] bg-transparent border border-ink text-ink py-2.5 text-xs tracking-[0.16em] uppercase cursor-pointer transition-colors hover:bg-ink hover:text-cream"
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}
