"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
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

  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;

  /**
   * False until the browser has taken over from the server render. Counts and
   * empty states wait on it, so a full bag never flashes as an empty one.
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
 */
const cartStore = createPersistedStore<CartLine[]>("feezee.cart.v2", [], (saved) =>
  Array.isArray(saved)
    ? saved.flatMap((line) => {
        const revived = reviveLine(line);
        return revived ? [revived] : [];
      })
    : [],
);

const wishStore = createPersistedStore<Record<number, boolean>>(
  "feezee.wishlist.v1",
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
  const wished = useSyncExternalStore(
    wishStore.subscribe,
    wishStore.getSnapshot,
    wishStore.getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    hydratedStore.subscribe,
    hydratedStore.getSnapshot,
    hydratedStore.getServerSnapshot,
  );

  // The two overlays are ordinary state: they belong to this tab and this visit.
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

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

  const toggleWish = useCallback((id: number) => {
    wishStore.update((w) => {
      const next = { ...w };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

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

  const wishedIds = useMemo(
    () =>
      Object.entries(wished)
        .filter(([, on]) => on)
        .map(([id]) => Number(id)),
    [wished],
  );

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
