"use server";

import { getSession } from "@/modules/customers/session";
import {
  listWishlist,
  mergeGuestWishlist,
  toggleWishlist,
} from "@/modules/wishlist";

/**
 * The two things the browser store needs from the wishlist.
 *
 * Both read the user from the session cookie and never from their argument, so
 * the only thing the page can influence is *which garment*, never *whose list*.
 * Both also answer a guest calmly with `signedIn: false` rather than throwing:
 * the store calls them on a scope cookie that may have expired while the tab sat
 * open, and the honest answer to that is "you are a guest now", not an error.
 */

/** A wishlist as the browser should hold it. */
export type WishlistSync = { signedIn: boolean; ids: number[] };

/** Guest lists are small by nature; this only bounds what a crafted one can cost. */
const MAX_MERGED = 200;

function productIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return values.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, MAX_MERGED);
}

/**
 * Called once the browser knows who it belongs to: hands over whatever the
 * guest had saved here, and gets back the account's wishlist with those folded
 * in. Passing an empty list is the ordinary case — a plain read.
 */
export async function syncWishlistAction(guestIds: unknown): Promise<WishlistSync> {
  const session = await getSession();
  if (!session) return { signedIn: false, ids: [] };

  const incoming = productIds(guestIds);
  const ids =
    incoming.length > 0
      ? await mergeGuestWishlist(session.userId, incoming)
      : await listWishlist(session.userId);

  return { signedIn: true, ids };
}

/** Heart or un-heart one garment. Returns the state to draw, not the one asked for. */
export async function toggleWishlistAction(
  productId: unknown,
): Promise<{ signedIn: boolean; wished: boolean }> {
  const session = await getSession();
  if (!session) return { signedIn: false, wished: false };

  if (!Number.isInteger(productId) || (productId as number) <= 0) {
    return { signedIn: true, wished: false };
  }

  const wished = await toggleWishlist(session.userId, productId as number);
  return { signedIn: true, wished };
}
