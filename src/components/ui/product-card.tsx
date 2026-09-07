"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store/store-provider";
import { HeartIcon } from "@/components/ui/icons";
import { discountPct, productHref, type Product } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * Tailwind needs the finished class name, so the ratios a card can take are
 * spelled out here rather than interpolated from the prop.
 */
const RATIO = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "2/3": "aspect-[2/3]",
} as const;

/**
 * Where the crop holds. Shoot frames are anchored at the top so a face is never
 * the thing that gets cut; a hanger frame is centred, because there the garment
 * sits in the middle and the floor below it is what should go.
 */
const FOCUS = {
  top: "object-top",
  center: "object-center",
} as const;

export function ProductCard({
  product,
  image,
  ratio = "4/5",
  focus = "top",
  sizes = "(max-width: 860px) 74vw, 25vw",
}: {
  product: Product;
  /**
   * A different frame of the same garment, from `public/img/`. The boutique
   * rail shows the hanger shot; everywhere else takes the product photograph.
   */
  image?: string;
  /** Crop of the photo. Category tiles run taller than the drop rail. */
  ratio?: keyof typeof RATIO;
  /** Which edge the crop holds when the photo is taller than the tile. */
  focus?: keyof typeof FOCUS;
  /** Rendered width of the tile, for the responsive image srcset. */
  sizes?: string;
}) {
  const { currency, wished, toggleWish } = useStore();
  const isWished = Boolean(wished[product.id]);
  const off = discountPct(product);

  return (
    <div className="group flex flex-col">
      <div className={cn("relative overflow-hidden bg-sand", RATIO[ratio])}>
        <Image
          src={img(image ?? product.img)}
          alt={product.name}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-[1.04]",
            FOCUS[focus],
          )}
        />
        {/*
          The photograph is the link to the garment's own page, laid over the
          image rather than around it: a card carries two buttons of its own,
          and a button inside an anchor is neither valid nor clickable. The
          overlay sits above the picture and below both controls.
        */}
        <Link
          href={productHref(product)}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-10"
        />
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 z-20 text-cream text-[11px] tracking-[0.14em] uppercase px-[9px] py-1",
              product.badge.tone === "wine" ? "bg-wine" : "bg-gold",
            )}
          >
            {/* A reduced piece says how much by, which is the only thing the
                word "Sale" on its own leaves the shopper to work out. */}
            {product.badge.label === "Sale" && off
              ? `${off}% Off`
              : product.badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWished}
          className={cn(
            "absolute top-2 right-2 z-20 w-[38px] h-[38px] border-none rounded-full bg-cream/92 cursor-pointer flex items-center justify-center",
            isWished ? "text-wine" : "text-ink",
          )}
        >
          <HeartIcon size={19} filled={isWished} />
        </button>
        {/*
          The tile reads as an editorial image until it is pointed at; the bag
          bar rides in over the bottom edge. `group-focus-within` keeps it
          reachable by keyboard, and on touch it simply stays put.
        */}
        {/*
          A size is a SKU with its own stock now, so a tile cannot add to the
          bag: picking one on the customer's behalf would quietly ship whichever
          size happened to be first on the rail. The bar goes to the garment's
          own page, where the sizes and what is left of each are on screen.
        */}
        <Link
          href={productHref(product)}
          aria-label={`Choose a size for ${product.name}`}
          className="absolute inset-x-0 bottom-0 z-20 bg-cream/95 text-ink hover:text-ink text-center py-3 text-[12px] tracking-[0.18em] uppercase translate-y-full opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
        >
          Select Size
        </Link>
      </div>

      {/*
        A grid row is as tall as its tallest caption, and on a phone two names
        beside each other are rarely the same number of lines — which left the
        prices of a pair sitting at two different heights. The caption takes
        the whole of the cell and the price is pushed to the foot of it, so
        every price in a row lands on one line whatever the names above did.
      */}
      <div className="flex-1 pt-3.5 px-2 nav:px-3 flex flex-col items-center gap-[5px] text-center">
        <Link
          href={productHref(product)}
          className="text-[13px] tracking-[0.18em] uppercase text-ink hover:text-gold-dark"
        >
          {product.name}
        </Link>
        <div className="text-[12.5px] text-muted tracking-[0.06em]">{product.fabric}</div>
        {/*
          A reduced piece prints two figures side by side, and half a phone's
          width is not always enough for both. Each one is kept whole and the
          pair is allowed to wrap instead, so the worst case is the old price
          on a second line — never "Rs" left stranded above its own number.
        */}
        <div className="mt-auto flex flex-wrap justify-center gap-x-2 gap-y-0.5 items-baseline">
          <span
            className={cn(
              "whitespace-nowrap text-[14.5px] font-medium",
              product.wasAed && "text-wine",
            )}
          >
            {formatPrice(product.aed, currency)}
          </span>
          {product.wasAed && (
            <span className="whitespace-nowrap text-[13px] text-muted line-through">
              {formatPrice(product.wasAed, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
