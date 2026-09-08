"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { useStore } from "@/components/store/store-provider";
import { priceBag } from "@/app/actions/cart";
import { formatPrice } from "@/lib/currency";
import { DEFAULT_SETTINGS } from "@/modules/shared/store-policy";
import type { PricedBasket } from "@/modules/orders";

/**
 * The bag, at full width. The drawer is for glancing at what was just added;
 * this is where quantities get settled and the totals are broken out — the
 * saving against the original prices, the 5% VAT, and whether delivery is free
 * yet.
 *
 * The numbers come from the server. The rows are drawn from the saved snapshot
 * straight away so nothing flashes, and the totals panel switches from the
 * indicative figure to the priced one as soon as the shop answers.
 */
export function CartContents() {
  const { cart, currency, subtotalAed, hydrated, clearBag } = useStore();
  const [priced, setPriced] = useState<PricedBasket | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (cart.length === 0) return;

    // `cancelled` rather than an AbortController: a server action cannot be
    // aborted, but a stale answer arriving after a quantity change can still be
    // ignored, which is the part that matters.
    let cancelled = false;
    priceBag(cart.map((l) => ({ variantId: l.variantId, quantity: l.qty })))
      .then((result) => {
        if (!cancelled) setPriced(result);
      })
      .catch(() => {
        /* Keep the snapshot totals; the checkout re-prices anyway. */
      });

    return () => {
      cancelled = true;
    };
  }, [cart, hydrated]);

  const saved = cart.reduce(
    (sum, line) => sum + ((line.wasAed ?? line.unitPriceAed) - line.unitPriceAed) * line.qty,
    0,
  );

  /*
   * Guarded on the bag rather than cleared when it empties: an emptied bag
   * renders its own empty state below, and wiping `priced` from inside the
   * effect would be state kept in sync with state.
   */
  const totals = cart.length > 0 ? priced?.totals : undefined;
  const displaySubtotal = totals?.subtotalAed ?? subtotalAed;
  const shortOfFreeDelivery =
    totals?.toFreeShippingAed ??
    Math.max(0, DEFAULT_SETTINGS.freeShippingThresholdAed - subtotalAed);

  const stockByVariant = new Map(
    (priced?.lines ?? []).map((line) => [line.variantId, line.available]),
  );

  // Before the saved bag has been read back there is nothing honest to draw:
  // an empty state would be wrong for anyone who has a bag, and a skeleton for
  // anyone who does not. A blank hold for one frame is the quieter of the two.
  if (!hydrated) return <div className="min-h-[40vh]" />;

  if (cart.length === 0) {
    return (
      <div className="py-[clamp(40px,7vw,90px)] text-center">
        <p className="m-0 font-display text-[clamp(22px,3vw,32px)]">
          Your bag is empty.
        </p>
        <p className="mt-3 mb-7 text-[15px] text-cocoa">
          Nothing added yet — the new season is a click away.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/new-in"
            className="bg-ink text-cream hover:text-cream px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Shop New In
          </Link>
          <Link
            href="/sale"
            className="border border-line text-ink hover:text-ink px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Shop Sale
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10 pb-[clamp(30px,4vw,56px)]">
      <div className="flex-[1_1_420px] min-w-0">
        {/* What the shop had to change about the bag, said plainly rather than
            done quietly. */}
        {priced && (priced.removed.length > 0 || priced.adjusted.length > 0) && (
          <div
            role="status"
            className="mb-5 border border-wine/40 bg-panel px-5 py-4 text-[14px] leading-[1.7] text-cocoa"
          >
            {priced.removed.map((label) => (
              <div key={label}>
                <strong className="text-wine">{label}</strong> has sold out and
                is no longer in your bag.
              </div>
            ))}
            {priced.adjusted.map((item) => (
              <div key={item.label}>
                Only {item.available} of <strong>{item.label}</strong> left — the
                quantity has come down.
              </div>
            ))}
          </div>
        )}

        {cart.map((line) => (
          <CartLineRow
            key={line.variantId}
            line={line}
            wide
            available={stockByVariant.get(line.variantId)}
          />
        ))}

        <button
          type="button"
          onClick={clearBag}
          className="mt-5 bg-transparent border-none cursor-pointer text-[12px] tracking-[0.14em] uppercase text-muted hover:text-wine"
        >
          Empty bag
        </button>
      </div>

      <aside className="flex-[1_1_300px] bg-panel p-[clamp(22px,3vw,34px)] flex flex-col gap-4">
        <h2 className="m-0 text-[13px] tracking-[0.22em] uppercase font-normal">
          Order Summary
        </h2>

        <dl className="m-0 flex flex-col gap-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-cocoa">Subtotal</dt>
            <dd className="m-0">{formatPrice(displaySubtotal, currency)}</dd>
          </div>
          {saved > 0 && (
            <div className="flex justify-between gap-4 text-wine">
              <dt>You save</dt>
              <dd className="m-0">−{formatPrice(saved, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-cocoa">Delivery</dt>
            <dd className="m-0">
              {totals
                ? totals.shippingFeeAed === 0
                  ? "Free"
                  : formatPrice(totals.shippingFeeAed, currency)
                : "Calculated at checkout"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-cocoa">VAT (5%)</dt>
            <dd className="m-0">
              {totals ? formatPrice(totals.vatAed, currency) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-[16px]">
            <dt className="tracking-[0.14em] uppercase text-[13px] self-center">
              Total
            </dt>
            <dd className="m-0 font-medium">
              {formatPrice(totals?.totalAed ?? displaySubtotal, currency)}
            </dd>
          </div>
        </dl>

        {shortOfFreeDelivery > 0 ? (
          <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
            Add {formatPrice(shortOfFreeDelivery, currency)} more for free UAE
            delivery.
          </p>
        ) : (
          <p className="m-0 text-[12.5px] leading-[1.5] text-gold-dark">
            Free UAE delivery unlocked.
          </p>
        )}

        <Link
          href="/checkout"
          className="text-center bg-ink text-cream hover:text-cream px-7 py-4 text-[13px] tracking-[0.18em] uppercase"
        >
          Checkout
        </Link>
        <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
          Cards and Apple Pay, cash on delivery, or bank transfer. Orders
          confirmed on WhatsApp before dispatch.
        </p>
      </aside>
    </div>
  );
}
