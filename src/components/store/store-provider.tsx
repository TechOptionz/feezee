"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_CURRENCY, type Currency } from "@/lib/currency";

type StoreState = {
  currency: Currency;
  bagCount: number;
  addToBag: () => void;
  wished: Record<number, boolean>;
  toggleWish: (id: number) => void;
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
};

const StoreContext = createContext<StoreState | null>(null);

/** Client-side shop state: bag, wishlist and the mobile drawer. */
export function StoreProvider({
  currency = DEFAULT_CURRENCY,
  children,
}: {
  currency?: Currency;
  children: React.ReactNode;
}) {
  const [bagCount, setBagCount] = useState(0);
  const [wished, setWished] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const addToBag = useCallback(() => setBagCount((n) => n + 1), []);
  const toggleWish = useCallback(
    (id: number) => setWished((w) => ({ ...w, [id]: !w[id] })),
    [],
  );
  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const value = useMemo(
    () => ({ currency, bagCount, addToBag, wished, toggleWish, menuOpen, toggleMenu, closeMenu }),
    [currency, bagCount, addToBag, wished, toggleWish, menuOpen, toggleMenu, closeMenu],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
