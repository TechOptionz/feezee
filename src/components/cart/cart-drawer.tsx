"use client";

import Link from "next/link";
import { useRef } from "react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { cartLineKey, useStore } from "@/components/store/store-provider";
import { BagIcon, CloseIcon } from "@/components/ui/icons";
import { productById } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { storeConfig } from "@/lib/site";
import { useOverlay } from "@/lib/use-overlay";

/**
 * The bag, slid in from the right. Adding anything opens it, which is the whole
 * confirmation the action gets — no toast, no jump to another page, and the
 * grid stays exactly where it was behind the panel.
 */
export function CartDrawer() {
  const {
    cart,
    cartOpen,
    closeCart,
    bagCount,
    subtotalPkr,
    currency,
    clearBag,
  } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlay(cartOpen, panelRef, closeCart);

  if (!cartOpen) return null;

  const shortOfFreeDelivery =
    storeConfig.freeShippingThresholdPkr - subtotalPkr;

  return (
    <>
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-ink/45 z-90"
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className="fixed top-0 right-0 bottom-0 w-[92%] max-w-[440px] bg-cream z-100 flex flex-col shadow-[-8px_0_40px_rgba(43,33,24,0.25)]"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h2 className="m-0 text-[14px] tracking-[0.22em] uppercase font-normal">
            Your Bag{bagCount > 0 && ` (${bagCount})`}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="bg-transparent border-none cursor-pointer p-2 -mr-2 text-ink"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="text-muted">
              <BagIcon size={40} />
            </span>
            <p className="m-0 text-[15px] text-cocoa">Your bag is empty.</p>
            <Link
              href="/new-in"
              onClick={closeCart}
              className="bg-ink text-cream hover:text-cream px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
            >
              Shop New In
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {cart.map((line) => {
                const product = productById(line.id);
                if (!product) return null;
                return (
                  <CartLineRow
                    key={cartLineKey(line)}
                    product={product}
                    qty={line.qty}
                    size={line.size}
                  />
                );
              })}

              <button
                type="button"
                onClick={clearBag}
                className="my-5 bg-transparent border-none cursor-pointer text-[12px] tracking-[0.14em] uppercase text-muted hover:text-wine"
              >
                Empty bag
              </button>
            </div>

            <div className="border-t border-line px-6 py-5 flex flex-col gap-3">
              {/* The one number that changes what someone does next: how far
                  off free delivery they are, or that they have cleared it. */}
              <p className="m-0 text-[12.5px] tracking-[0.08em] text-muted">
                {shortOfFreeDelivery > 0
                  ? `${formatPrice(shortOfFreeDelivery, currency)} away from free nationwide delivery`
                  : "Free nationwide delivery unlocked"}
              </p>

              <div className="flex justify-between items-baseline">
                <span className="text-[13px] tracking-[0.18em] uppercase">
                  Subtotal
                </span>
                <span className="text-[17px] font-medium">
                  {formatPrice(subtotalPkr, currency)}
                </span>
              </div>

              <Link
                href="/cart"
                onClick={closeCart}
                className="text-center bg-ink text-cream hover:text-cream px-7 py-4 text-[13px] tracking-[0.18em] uppercase"
              >
                View Bag & Checkout
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="bg-transparent border-none cursor-pointer text-[12.5px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
