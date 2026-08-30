"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { productById } from "@/content/products";
import { DEFAULT_CURRENCY, type Currency } from "@/lib/currency";
import { createPersistedStore, hydratedStore } from "@/lib/persisted-store";

/**
 * One row of the bag: which garment, in which size, and how many of it.
 *
 * `size` is what the garment's own page sends; a card in a grid still adds
 * without one, and that line is the "size to be confirmed" row the bag shows.
 * Two rows of the same garment in different sizes are two rows, which is why
 * every operation on the bag takes the size as well as the id.
 */
export type CartLine = { id: number; qty: number; size?: string };

/** The identity of a row: the garment and the size together. */
export function cartLineKey(line: { id: number; size?: string }): string {
  return `${line.id}|${line.size ?? ""}`;
}

type StoreState = {
  currency: Currency;

  cart: CartLine[];
  /** Total garments in the bag, which is what the header badge counts. */
  bagCount: number;
  /** Bag total in AED, before delivery. */
  subtotalAed: number;
  addToBag: (id: number, qty?: number, size?: string) => void;
  setQty: (id: number, qty: number, size?: string) => void;
  removeFromBag: (id: number, size?: string) => void;
  clearBag: () => void;

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

/*
 * Both stores are created once, at module scope, so every component that reads
 * them reads the same one — and so a bag survives a route change, which remounts
 * the provider's children but not this module.
 *
 * `revive` is the guard against a saved bag that has outlived the catalogue: a
 * line pointing at a garment that no longer exists, or a quantity edited to
 * nonsense in devtools, is dropped rather than crashing the header on it.
 */
const cartStore = createPersistedStore<CartLine[]>(
  "feezee.cart.v1",
  [],
  (saved) =>
    Array.isArray(saved)
      ? saved
          .filter(
            (line): line is CartLine =>
              typeof line?.id === "number" &&
              typeof line?.qty === "number" &&
              line.qty > 0 &&
              Boolean(productById(line.id)),
          )
          .map((line) => ({
            id: line.id,
            qty: Math.floor(line.qty),
            ...(typeof line.size === "string" && line.size
              ? { size: line.size }
              : {}),
          }))
      : [],
);

const wishStore = createPersistedStore<Record<number, boolean>>(
  "feezee.wishlist.v1",
  {},
  (saved) => {
    if (!saved || typeof saved !== "object") return {};
    const out: Record<number, boolean> = {};
    for (const [id, on] of Object.entries(saved)) {
      if (on === true && productById(Number(id))) out[Number(id)] = true;
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

  const addToBag = useCallback((id: number, qty = 1, size?: string) => {
    if (!productById(id)) return;
    const key = cartLineKey({ id, size });
    cartStore.update((lines) =>
      lines.some((line) => cartLineKey(line) === key)
        ? lines.map((line) =>
            cartLineKey(line) === key ? { ...line, qty: line.qty + qty } : line,
          )
        : [...lines, size ? { id, qty, size } : { id, qty }],
    );
    // Opening the drawer is the whole confirmation the action gets — no toast,
    // and the grid behind it does not move.
    setCartOpen(true);
  }, []);

  const setQty = useCallback((id: number, qty: number, size?: string) => {
    const key = cartLineKey({ id, size });
    cartStore.update((lines) =>
      qty <= 0
        ? lines.filter((line) => cartLineKey(line) !== key)
        : lines.map((line) =>
            cartLineKey(line) === key ? { ...line, qty } : line,
          ),
    );
  }, []);

  const removeFromBag = useCallback((id: number, size?: string) => {
    const key = cartLineKey({ id, size });
    cartStore.update((lines) => lines.filter((line) => cartLineKey(line) !== key));
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
    () =>
      cart.reduce(
        (sum, line) => sum + (productById(line.id)?.aed ?? 0) * line.qty,
        0,
      ),
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
