"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store/store-provider";
import { PlusMinusIcon, TrashIcon } from "@/components/ui/icons";
import { productHref, type Product } from "@/content/products";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * One garment in the bag — the same row in the drawer and on the bag page, so
 * the quantity stepper behaves identically wherever the bag is opened. `wide`
 * is the bag page, which from the nav breakpoint has the room to reserve a
 * column for the line total so the totals line up down the list.
 */
export function CartLineRow({
  product,
  qty,
  size,
  wide = false,
}: {
  product: Product;
  qty: number;
  /** The size chosen on the garment's page. Absent for a card-added line. */
  size?: string;
  wide?: boolean;
}) {
  const { currency, setQty, removeFromBag } = useStore();

  return (
    <div className="flex gap-4 py-5 border-b border-line last:border-b-0">
      <Link
        href={productHref(product)}
        className="relative w-[84px] shrink-0 aspect-[4/5] bg-sand overflow-hidden"
        aria-hidden
        tabIndex={-1}
      >
        <Image
          src={img(product.img)}
          alt=""
          fill
          sizes="84px"
          className="object-cover object-top"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/*
          The total used to be a third column of its own. Beside a 84px
          photograph that left about 130px for everything in the middle, and on
          a phone the name, the fabric and the size each broke over two lines
          while the column beside them stood empty below the price. Sharing the
          first line with the name instead gives the lines under it the whole
          width — and on the bag page, where there is room, the price still
          holds its own reserved column at the right.
        */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={productHref(product)}
            className="min-w-0 text-[13px] tracking-[0.16em] uppercase text-ink hover:text-gold-dark"
          >
            {product.name}
          </Link>

          <div
            className={cn(
              "flex flex-col items-end gap-1 text-right shrink-0",
              wide && "nav:min-w-[110px]",
            )}
          >
            <span className="text-[14.5px] font-medium">
              {formatPrice(product.pkr * qty, currency)}
            </span>
            {product.wasPkr && (
              <span className="text-[12.5px] text-muted line-through">
                {formatPrice(product.wasPkr * qty, currency)}
              </span>
            )}
            {qty > 1 && (
              <span className="text-[12px] text-muted">
                {formatPrice(product.pkr, currency)} each
              </span>
            )}
          </div>
        </div>

        <div className="text-[12.5px] text-muted tracking-[0.06em]">
          {product.fabric}
        </div>
        {/* A bag row without a size is one added straight off a grid; the
            checkout confirms it on WhatsApp, so it says that rather than
            pretending a size was chosen. */}
        <div className="text-[12.5px] tracking-[0.14em] uppercase text-muted">
          {size ? `Size ${size}` : "Size confirmed on WhatsApp"}
        </div>

        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {/* A stepper rather than a number field: on a phone the keyboard
              opening over the bag to change a 1 into a 2 is a poor trade. */}
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQty(product.id, qty - 1, size)}
              aria-label={`Reduce quantity of ${product.name}`}
              className="w-9 h-9 flex items-center justify-center cursor-pointer text-ink hover:bg-panel"
            >
              <PlusMinusIcon open />
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center text-[14px] tabular-nums"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(product.id, qty + 1, size)}
              aria-label={`Increase quantity of ${product.name}`}
              className="w-9 h-9 flex items-center justify-center cursor-pointer text-ink hover:bg-panel"
            >
              <PlusMinusIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeFromBag(product.id, size)}
            aria-label={`Remove ${product.name} from bag`}
            className="flex items-center gap-1.5 py-2 text-[12px] tracking-[0.14em] uppercase text-muted hover:text-wine cursor-pointer bg-transparent border-none"
          >
            <TrashIcon />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
