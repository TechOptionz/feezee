import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The wishlist of a signed-in customer.
 *
 * Saved pieces used to live only in `localStorage`, which meant one browser had
 * one wishlist no matter who was signed into it: a customer and an administrator
 * sharing a laptop saw each other's saved garments, and the same customer on a
 * phone saw none of them. An account's saved pieces belong to the account, so
 * they belong in the database.
 *
 * A guest still keeps theirs in the browser — there is no row to hang them on
 * until there is a user — and `mergeGuestWishlist` is what carries that across
 * at the moment of signing in, so hearting something and then registering does
 * not quietly lose it.
 *
 * Every function here takes the user id from its caller, and every caller reads
 * it from the session cookie rather than from the browser. A product id arriving
 * from the page is only ever used *together with* that session id, so a guessed
 * id belonging to someone else matches nothing.
 */

/** Saved product ids, most recently saved first. */
export async function listWishlist(userId: string): Promise<number[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}

/**
 * Save the piece, or unsave it if it is already saved. Returns its new state.
 *
 * Both halves are written to tolerate having already happened. Two tabs, or a
 * double-tap on a slow connection, send the same toggle twice; the unique index
 * turns the second save into a no-op rather than a duplicate row, and deleting
 * a row that is already gone is not an error either. What comes back is what is
 * true after the write, which is what the heart should be drawn from.
 */
export async function toggleWishlist(
  userId: string,
  productId: number,
): Promise<boolean> {
  const { count } = await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });
  if (count > 0) return false;

  try {
    await prisma.wishlistItem.create({ data: { userId, productId } });
    return true;
  } catch (error) {
    // P2002: the other tab saved it first. P2003: the product no longer exists,
    // which a stale page can still ask for — neither is worth an error page.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2003")
    ) {
      return error.code === "P2002";
    }
    throw error;
  }
}

/**
 * Fold the ids a guest saved in this browser into their account, and give back
 * the whole wishlist afterwards.
 *
 * The ids are filtered against the catalogue first. They arrive from
 * `localStorage`, where they may have been sitting since before a product was
 * deleted and where nothing stops them being edited by hand, so they are
 * treated as a request rather than as fact — anything that is not a real
 * product is dropped instead of throwing a foreign key error.
 *
 * The merge is additive on purpose. Signing in should never take a saved piece
 * away, in either direction: what was in the browser is added to the account,
 * and what was already on the account stays.
 */
export async function mergeGuestWishlist(
  userId: string,
  productIds: number[],
): Promise<number[]> {
  const wanted = [...new Set(productIds.filter(Number.isInteger))];

  if (wanted.length > 0) {
    const real = await prisma.product.findMany({
      where: { id: { in: wanted } },
      select: { id: true },
    });

    if (real.length > 0) {
      await prisma.wishlistItem.createMany({
        data: real.map((product) => ({ userId, productId: product.id })),
        skipDuplicates: true,
      });
    }
  }

  return listWishlist(userId);
}
