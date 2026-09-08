"use server";

import { priceBasket, type BasketLine, type PricedBasket } from "@/modules/orders";

/**
 * Re-price the bag on the server.
 *
 * The bag itself lives in `localStorage`, which is the right place for it — it
 * survives a closed tab and needs no account. What it cannot be is *trusted*:
 * the price in a saved row was true the day it was added, and everything in it
 * is editable from the browser console.
 *
 * So the client sends variant ids and quantities, and gets back what the shop
 * says those cost today, what is still on the rail, and what changed. The cart
 * page draws its snapshot immediately and corrects itself when this returns —
 * no spinner over a bag the customer can already read.
 */
export async function priceBag(lines: BasketLine[]): Promise<PricedBasket> {
  const safe = lines
    .filter((line) => typeof line.variantId === "string" && line.variantId.length > 0)
    .map((line) => ({
      variantId: line.variantId,
      quantity: Math.max(1, Math.min(Math.floor(line.quantity) || 1, 20)),
    }));

  return priceBasket(safe);
}
