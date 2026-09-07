"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore, type CartLine } from "@/components/store/store-provider";
import { PlusMinusIcon, TrashIcon } from "@/components/ui/icons";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * One garment in the bag — the same row in the drawer and on the bag page, so
 * the quantity stepper behaves identically wherever the bag is opened. `wide`
 * is the bag page, which from the nav breakpoint has the room to reserve a
 * column for the line total so the totals line up down the list.
 *
 * `available` is the live stock the server reported for this variant when the
 * page priced the bag. It is what stops the stepper at what is actually on the
 * rail, rather than letting someone ask for six of the last two and finding out
 * at checkout.
 */
export function CartLineRow({
  line,
  wide = false,
  available,
}: {
  line: CartLine;
  wide?: boolean;
  available?: number;
}) {
  const { currency, setQty, removeFromBag } = useStore();
  const href = `/product/${line.slug}`;
  const atCeiling = available !== undefined && line.qty >= available;

  return (
    <div className="flex gap-4 py-5 border-b border-line last:border-b-0">
      <Link
        href={href}
        className="relative w-[84px] shrink-0 aspect-[4/5] bg-sand overflow-hidden"
        aria-hidden
        tabIndex={-1}
      >
        {line.image && (
          <Image
            src={img(line.image)}
            alt=""
            fill
            sizes="84px"
            className="object-cover object-top"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={href}
            className="min-w-0 text-[13px] tracking-[0.16em] uppercase text-ink hover:text-gold-dark"
          >
            {line.name}
          </Link>

          <div
            className={cn(
              "flex flex-col items-end gap-1 text-right shrink-0",
              wide && "nav:min-w-[110px]",
            )}
          >
            <span className="text-[14.5px] font-medium">
              {formatPrice(line.unitPriceAed * line.qty, currency)}
            </span>
            {line.wasAed && (
              <span className="text-[12.5px] text-muted line-through">
                {formatPrice(line.wasAed * line.qty, currency)}
              </span>
            )}
            {line.qty > 1 && (
              <span className="text-[12px] text-muted">
                {formatPrice(line.unitPriceAed, currency)} each
              </span>
            )}
          </div>
        </div>

        <div className="text-[12.5px] text-muted tracking-[0.06em]">
          {line.fabric}
        </div>
        <div className="text-[12.5px] tracking-[0.14em] uppercase text-muted">
          Size {line.size}
          {line.sku && <span className="ml-2 normal-case tracking-normal">· {line.sku}</span>}
        </div>

        {available !== undefined && available <= 3 && available > 0 && (
          <div className="text-[12.5px] text-wine">
            Only {available} left on the rail
          </div>
        )}

        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {/* A stepper rather than a number field: on a phone the keyboard
              opening over the bag to change a 1 into a 2 is a poor trade. */}
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQty(line.variantId, line.qty - 1)}
              aria-label={`Reduce quantity of ${line.name}`}
              className="w-9 h-9 flex items-center justify-center cursor-pointer text-ink hover:bg-panel"
            >
              <PlusMinusIcon open />
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center text-[14px] tabular-nums"
            >
              {line.qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(line.variantId, line.qty + 1)}
              disabled={atCeiling}
              aria-label={
                atCeiling
                  ? `No more ${line.name} in size ${line.size} available`
                  : `Increase quantity of ${line.name}`
              }
              className={cn(
                "w-9 h-9 flex items-center justify-center text-ink",
                atCeiling
                  ? "cursor-not-allowed text-muted/50"
                  : "cursor-pointer hover:bg-panel",
              )}
            >
              <PlusMinusIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeFromBag(line.variantId)}
            aria-label={`Remove ${line.name} from bag`}
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
