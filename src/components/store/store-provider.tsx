"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  syncWishlistAction,
  toggleWishlistAction,
} from "@/app/actions/wishlist";
import { readAccountScope, scopedKey } from "@/lib/account-scope";
import { DEFAULT_CURRENCY, type Currency } from "@/lib/currency";
import { createPersistedStore, hydratedStore } from "@/lib/persisted-store";

/**
 * One row of the bag.
 *
 * The row carries a **snapshot** of the garment — name, fabric, photograph,
 * price — rather than an id to look up. Two reasons, and the second is the one
 * that matters:
 *
 * 1. The catalogue now lives in the database, and the bag lives in
 *    `localStorage` in the browser. A client component cannot reach Prisma, so
 *    a row that held only an id would have nothing to draw until a round trip
 *    came back, and the drawer would open empty for a frame on every page.
 * 2. `variantId` is the size, not a note about it. The same suit in L and in XL
 *    are two variants, two SKUs and two separate pieces of stock, so they are
 *    two rows — and the row can name exactly which one.
 *
 * The snapshot is for *display only*. Every price is recomputed on the server
 * when the bag is priced and again when the order is placed, so a stale or
 * edited snapshot can change what the browser draws and never what is charged.
 */
export type CartLine = {
  variantId: string;
  productId: number;
  slug: string;
  name: string;
  fabric: string;
  image: string;
  size: string;
  sku: string;
  unitPriceAed: number;
  wasAed?: number;
  qty: number;
};

/** The identity of a row. A variant already is the garment and the size. */
export function cartLineKey(line: { variantId: string }): string {
  return line.variantId;
}

type StoreState = {
  currency: Currency;

  cart: CartLine[];
  /** Total garments in the bag, which is what the header badge counts. */
  bagCount: number;
  /** Bag total in AED, before VAT and delivery. Indicative — see above. */
  subtotalAed: number;
  addToBag: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeFromBag: (variantId: string) => void;
  clearBag: () => void;
  /** After a successful order: the bag is gone, not merely emptied. */
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  wished: Record<number, boolean>;
  wishedIds: number[];
  wishCount: number;
  toggleWish: (id: number) => void;
  /**
   * False until the wishlist on screen is the right one for whoever is signed
   * in. A signed-in customer's saved pieces come from the database, which is a
   * round trip away, and `hydrated` alone would say "ready" while the answer
   * was still an empty guest list — long enough to print "Nothing saved yet."
   * over a wishlist that is not empty.
   */
  wishReady: boolean;

  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;

  /**
   * False until the browser has taken over from the server render *and* it
   * knows whose bag it is holding. Counts and empty states wait on it, so a
   * full bag never flashes as an empty one — nor a guest's bag as the bag of
   * the customer who has just signed in.
   */
  hydrated: boolean;
};

const StoreContext = createContext<StoreState | null>(null);

/** Anything saved that is not a well-formed line is dropped rather than drawn. */
function reviveLine(value: unknown): CartLine | null {
  if (!value || typeof value !== "object") return null;
  const line = value as Record<string, unknown>;

  if (
    typeof line.variantId !== "string" ||
    typeof line.productId !== "number" ||
    typeof line.name !== "string" ||
    typeof line.size !== "string" ||
    typeof line.unitPriceAed !== "number" ||
    typeof line.qty !== "number" ||
    line.qty <= 0
  ) {
    return null;
  }

  return {
    variantId: line.variantId,
    productId: line.productId,
    slug: typeof line.slug === "string" ? line.slug : "",
    name: line.name,
    fabric: typeof line.fabric === "string" ? line.fabric : "",
    image: typeof line.image === "string" ? line.image : "",
    size: line.size,
    sku: typeof line.sku === "string" ? line.sku : "",
    unitPriceAed: line.unitPriceAed,
    ...(typeof line.wasAed === "number" ? { wasAed: line.wasAed } : {}),
    qty: Math.floor(line.qty),
  };
}

/*
 * Both stores are created once, at module scope, so every component that reads
 * them reads the same one — and so a bag survives a route change, which remounts
 * the provider's children but not this module.
 *
 * The keys below are the *guest* keys. A signed-in customer's bag moves to a
 * key of its own the moment the browser learns who they are, so two accounts
 * sharing a machine no longer share a bag. Their wishlist does not live here at
 * all — it is in the database, and the store holds what the server said.
 */
const CART_KEY = "feezee.cart.v2";
const WISH_KEY = "feezee.wishlist.v1";

const cartStore = createPersistedStore<CartLine[]>(CART_KEY, [], (saved) =>
  Array.isArray(saved)
    ? saved.flatMap((line) => {
        const revived = reviveLine(line);
        return revived ? [revived] : [];
      })
    : [],
);

/**
 * The wishlist of someone who is not signed in.
 *
 * There is no row to hang a saved piece on until there is an account, so a
 * guest's hearts stay in the browser. They are not lost on signing in: the
 * first thing the provider does once it knows the account is hand these over to
 * be folded into it, and only then empty this.
 */
const wishStore = createPersistedStore<Record<number, boolean>>(
  WISH_KEY,
  {},
  (saved) => {
    if (!saved || typeof saved !== "object") return {};
    const out: Record<number, boolean> = {};
    for (const [id, on] of Object.entries(saved)) {
      const parsed = Number(id);
      if (on === true && Number.isFinite(parsed)) out[parsed] = true;
    }
    return out;
  },
);

/**
 * A guest's bag, folded into the bag already on the account they just signed
 * into. Same variant means same row, so the quantities add rather than the row
 * appearing twice.
 *
 * A sum here can exceed what is actually on the shelf. That is safe, and
 * deliberately not guarded: §4.1 — the bag is never the authority on stock, and
 * both the bag page and the order transaction re-check every line against the
 * database before anything is charged.
 */
function mergeBags(from: CartLine[], into: CartLine[]): CartLine[] {
  if (from.length === 0) return into;

  const merged = [...into];
  for (const line of from) {
    const at = merged.findIndex((l) => l.variantId === line.variantId);
    if (at >= 0) merged[at] = { ...merged[at], qty: merged[at].qty + line.qty };
    else merged.push(line);
  }
  return merged;
}

/** Saved ids as the flag map the product tiles read. */
function asWishedMap(ids: number[]): Record<number, boolean> {
  const out: Record<number, boolean> = {};
  for (const id of ids) out[id] = true;
  return out;
}

/** Client-side shop state: the bag, the wishlist and the two overlays. */
export function StoreProvider({
  currency = DEFAULT_CURRENCY,
  children,
}: {
  currency?: Currency;
  children: React.ReactNode;
}) {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const guestWished = useSyncExternalStore(
    wishStore.subscribe,
    wishStore.getSnapshot,
    wishStore.getServerSnapshot,
  );
  const browserReady = useSyncExternalStore(
    hydratedStore.subscribe,
    hydratedStore.getSnapshot,
    hydratedStore.getServerSnapshot,
  );

  // The two overlays are ordinary state: they belong to this tab and this visit.
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  /*
   * Who this browser belongs to.
   *
   * `undefined` is "not asked yet", and it is deliberately distinct from `null`
   * — a guest — because the first client render has to draw exactly what the
   * server drew or hydration breaks. The server cannot know the account (§4.10
   * forbids the cookie read that would tell it), so the first render is the
   * account-less one and the answer arrives immediately afterwards.
   */
  const [scope, setScope] = useState<string | null | undefined>(undefined);

  /*
   * Sign-in and sign-out are server actions followed by a redirect, which is a
   * client navigation: this module is never re-evaluated, so nothing else would
   * notice the account had changed. Re-reading on every route change catches
   * both, and `focus` catches the tab that was signed out from another one.
   */
  const pathname = usePathname();
  useEffect(() => {
    const reread = () => setScope(readAccountScope());
    reread();
    window.addEventListener("focus", reread);
    return () => window.removeEventListener("focus", reread);
  }, [pathname]);

  /*
   * Point the bag at the account's own key.
   *
   * The bag is *moved* only when a guest signs in, which is the one case where
   * it should follow: you filled it, then you identified yourself. Moving on
   * any other transition would hand one person's bag to the next — an admin
   * signing in after a customer must find their own bag, not inherit theirs.
   */
  const previousScope = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (scope === undefined) return;

    const cameFrom = previousScope.current;
    previousScope.current = scope;
    const guestSigningIn = scope !== null && (cameFrom === undefined || cameFrom === null);

    cartStore.retarget(scopedKey(CART_KEY, scope), guestSigningIn ? mergeBags : undefined);
  }, [scope]);

  /*
   * The signed-in wishlist, as the database last reported it — tagged with the
   * account it was reported for.
   *
   * Carrying the account alongside the ids is what lets everything below be
   * derived rather than kept in step by an effect: a list belonging to a
   * different account simply *is not* this account's list, so there is no
   * moment where the previous customer's saved pieces are still on screen under
   * the new one's name. `ids: null` is an attempt that failed, which has to
   * stop the page waiting without claiming the wishlist is empty.
   */
  const [wishState, setWishState] = useState<{
    scope: string;
    ids: number[] | null;
  } | null>(null);

  const accountWishedIds =
    scope != null && wishState?.scope === scope ? wishState.ids : null;

  useEffect(() => {
    if (scope === undefined || scope === null) return;
    // Already answered for this account — including answered with a failure,
    // which must not turn into a retry loop.
    if (wishState?.scope === scope) return;

    let abandoned = false;

    // Whatever was hearted before signing in goes with them. The server folds
    // it in and answers with the whole list, so one round trip does both.
    const carried = Object.keys(wishStore.getSnapshot()).map(Number);

    syncWishlistAction(carried)
      .then((result) => {
        if (abandoned) return;

        if (!result.signedIn) {
          // The scope cookie outlived the session — a tab left open past the
          // thirty days. Fall back to being a guest rather than showing a list
          // that is no longer anybody's.
          setWishState({ scope, ids: null });
          return;
        }

        setWishState({ scope, ids: result.ids });
        // Only now, once the account has them, is it safe to let these go.
        if (carried.length > 0) wishStore.update(() => ({}));
      })
      .catch(() => {
        // Offline, or the action failed. Stop waiting, but do not pretend the
        // account has nothing saved.
        if (!abandoned) setWishState({ scope, ids: null });
      });

    return () => {
      abandoned = true;
    };
  }, [scope, wishState]);

  const addToBag = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    cartStore.update((lines) =>
      lines.some((l) => l.variantId === line.variantId)
        ? lines.map((l) =>
            l.variantId === line.variantId
              ? // The snapshot is refreshed as well as the count: the page that
                // just added knows the current price better than the row saved
                // three weeks ago does.
                { ...l, ...line, qty: l.qty + qty }
              : l,
          )
        : [...lines, { ...line, qty }],
    );
    // Opening the drawer is the whole confirmation the action gets — no toast,
    // and the grid behind it does not move.
    setCartOpen(true);
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    cartStore.update((lines) =>
      qty <= 0
        ? lines.filter((l) => l.variantId !== variantId)
        : lines.map((l) => (l.variantId === variantId ? { ...l, qty } : l)),
    );
  }, []);

  const removeFromBag = useCallback((variantId: string) => {
    cartStore.update((lines) => lines.filter((l) => l.variantId !== variantId));
  }, []);

  const clearBag = useCallback(() => cartStore.update(() => []), []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  /**
   * Heart or un-heart a garment.
   *
   * A guest's heart is a write to `localStorage` and nothing more. A customer's
   * is a row in the database, drawn optimistically because a heart that waits
   * for a round trip before filling in feels broken — and then reconciled to
   * whatever the server actually says, so a write that was rejected or that
   * raced another tab corrects itself instead of leaving the tile lying about
   * what is saved.
   */
  const toggleWish = useCallback(
    (id: number) => {
      if (!scope) {
        wishStore.update((w) => {
          const next = { ...w };
          if (next[id]) delete next[id];
          else next[id] = true;
          return next;
        });
        return;
      }

      /*
       * Written as "set it to this", not "flip it", and applied to whatever the
       * state holds at the time. Two hearts tapped quickly then settle against
       * each other's writes rather than against a list captured before either
       * of them started. Newest first, matching the order the database reports.
       */
      const applyWish = (wished: boolean) =>
        setWishState((previous) => {
          const held = previous?.scope === scope ? (previous.ids ?? []) : [];
          const without = held.filter((saved) => saved !== id);
          return { scope, ids: wished ? [id, ...without] : without };
        });

      const wasWished = (accountWishedIds ?? []).includes(id);
      applyWish(!wasWished);

      toggleWishlistAction(id)
        .then((result) => {
          if (result.signedIn) applyWish(result.wished);
          else setWishState({ scope, ids: null });
        })
        // Put it back the way the server still has it.
        .catch(() => applyWish(wasWished));
    },
    [scope, accountWishedIds],
  );

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const bagCount = useMemo(
    () => cart.reduce((n, line) => n + line.qty, 0),
    [cart],
  );

  const subtotalAed = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPriceAed * line.qty, 0),
    [cart],
  );

  /*
   * One of the two, never a blend: the account's list when there is an account,
   * the browser's when there is not. Guest ids come back in ascending product
   * order, which is what integer-like object keys give; the account's come back
   * newest first, which is the more useful order and worth preserving.
   */
  const wishedIds = useMemo(
    () =>
      accountWishedIds ??
      Object.entries(guestWished)
        .filter(([, on]) => on)
        .map(([id]) => Number(id)),
    [accountWishedIds, guestWished],
  );

  const wished = useMemo(
    () => (accountWishedIds === null ? guestWished : asWishedMap(accountWishedIds)),
    [accountWishedIds, guestWished],
  );

  // Nothing on screen may claim to know the bag until the browser has taken
  // over *and* it knows whose bag it is.
  const hydrated = browserReady && scope !== undefined;

  // The wishlist needs the round trip on top of that — but only when there is
  // an account to make it for. A guest's list is already in hand.
  const wishReady =
    hydrated && (scope === null || wishState?.scope === scope);

  const value = useMemo(
    () => ({
      currency,
      cart,
      bagCount,
      subtotalAed,
      addToBag,
      setQty,
      removeFromBag,
      clearBag,
      cartOpen,
      openCart,
      closeCart,
      wished,
      wishedIds,
      wishCount: wishedIds.length,
      toggleWish,
      wishReady,
      menuOpen,
      toggleMenu,
      closeMenu,
      hydrated,
    }),
    [
      currency,
      cart,
      bagCount,
      subtotalAed,
      addToBag,
      setQty,
      removeFromBag,
      clearBag,
      cartOpen,
      openCart,
      closeCart,
      wished,
      wishedIds,
      toggleWish,
      wishReady,
      menuOpen,
      toggleMenu,
      closeMenu,
      hydrated,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
