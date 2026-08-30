"use client";

import Link from "next/link";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { cartLineKey, useStore } from "@/components/store/store-provider";
import { productById } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";

/**
 * The bag, at full width. The drawer is for glancing at what was just added;
 * this is where quantities get settled and the totals are broken out — the
 * saving against the original prices, and whether delivery is free yet.
 */
export function CartContents() {
  const { cart, currency, subtotalPkr, hydrated, clearBag } = useStore();

  /*
   * `flatMap` rather than map-then-filter: dropping a line whose garment has
   * left the catalogue and narrowing the type are the same step, so there is no
   * intermediate shape carrying a `Product | undefined` for the rest of the
   * component to keep re-checking.
   */
  const lines = cart.flatMap((line) => {
    const product = productById(line.id);
    return product
      ? [{ key: cartLineKey(line), product, qty: line.qty, size: line.size }]
      : [];
  });

  const saved = lines.reduce(
    (sum, { product, qty }) =>
      sum + ((product.wasPkr ?? product.pkr) - product.pkr) * qty,
    0,
  );
  const shortOfFreeDelivery = storeConfig.freeShippingThresholdPkr - subtotalPkr;

  // Before the saved bag has been read back there is nothing honest to draw:
  // an empty state would be wrong for anyone who has a bag, and a skeleton for
  // anyone who does not. A blank hold for one frame is the quieter of the two.
  if (!hydrated) return <div className="min-h-[40vh]" />;

  if (lines.length === 0) {
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
            className="bg-ink text-cream hover:text-cream px-7 py-3.5 text-[12px] tracking-[0.18em] uppercase"
          >
            Shop New In
          </Link>
          <Link
            href="/sale"
            className="border border-line text-ink hover:text-ink px-7 py-3.5 text-[12px] tracking-[0.18em] uppercase"
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
        {lines.map(({ key, product, qty, size }) => (
          <CartLineRow key={key} product={product} qty={qty} size={size} wide />
        ))}

        <button
          type="button"
          onClick={clearBag}
          className="mt-5 bg-transparent border-none cursor-pointer text-[11px] tracking-[0.14em] uppercase text-muted hover:text-wine"
        >
          Empty bag
        </button>
      </div>

      <aside className="flex-[1_1_300px] bg-panel p-[clamp(22px,3vw,34px)] flex flex-col gap-4">
        <h2 className="m-0 text-[12px] tracking-[0.22em] uppercase font-normal">
          Order Summary
        </h2>

        <dl className="m-0 flex flex-col gap-3 text-[14px]">
          <div className="flex justify-between gap-4">
            <dt className="text-cocoa">Subtotal</dt>
            <dd className="m-0">{formatPrice(subtotalPkr, currency)}</dd>
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
              {shortOfFreeDelivery > 0 ? "Calculated at checkout" : "Free"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-[16px]">
            <dt className="tracking-[0.14em] uppercase text-[12px] self-center">
              Total
            </dt>
            <dd className="m-0 font-medium">
              {formatPrice(subtotalPkr, currency)}
            </dd>
          </div>
        </dl>

        {shortOfFreeDelivery > 0 && (
          <p className="m-0 text-[11.5px] leading-[1.5] text-muted">
            Add {formatPrice(shortOfFreeDelivery, currency)} more for free
            nationwide delivery.
          </p>
        )}

        {/* Presentational, as in the design — point this at the payment
            provider when one is chosen. */}
        <button
          type="button"
          className="bg-ink text-cream border-none cursor-pointer px-7 py-4 text-[12px] tracking-[0.18em] uppercase"
        >
          Checkout
        </button>
        <p className="m-0 text-[11.5px] leading-[1.5] text-muted">
          Cash on delivery, bank transfer and cards. Orders confirmed on
          WhatsApp before dispatch.
        </p>
      </aside>
    </div>
  );
}
