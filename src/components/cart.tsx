"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  priceKes: number;
  image?: string;
  size: string;
}

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ivk_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  // Thrift pieces are one of a kind, so an item is either in the cart or not.
  const add = useCallback((item: CartItem) => setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item])), []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return <CartContext.Provider value={{ items, ready, add, remove, clear, has }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function CartCount() {
  const { items } = useCart();
  if (!items.length) return null;
  return <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">{items.length}</span>;
}

export function AddToCartButton({ item, disabled }: { item: CartItem; disabled?: boolean }) {
  const { add, has } = useCart();
  const inCart = has(item.id);
  if (disabled) {
    return (
      <button disabled className="w-full rounded-full bg-stone-300 px-6 py-3 font-semibold text-stone-600">
        Sold out
      </button>
    );
  }
  return (
    <button
      onClick={() => add(item)}
      disabled={inCart}
      className="w-full rounded-full bg-ivy px-6 py-3 font-semibold text-white transition hover:bg-ivy-dark disabled:bg-ivy/60"
    >
      {inCart ? "In your bag" : "Add to bag"}
    </button>
  );
}

export function ClearCartOnMount() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
