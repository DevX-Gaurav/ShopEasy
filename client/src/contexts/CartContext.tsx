import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KEYS, readKey, subscribe, writeKey } from "@/lib/storage";
import type { CartItem } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  remove: (productId: string, color?: string, size?: string) => void;
  setQty: (productId: string, qty: number, color?: string, size?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_KEY = "guest";

function readCarts(): Record<string, CartItem[]> {
  return readKey<Record<string, CartItem[]>>(KEYS.carts, {});
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const cartKey = user?.id ?? GUEST_KEY;
  const [items, setItems] = useState<CartItem[]>(() => readCarts()[cartKey] ?? []);

  useEffect(() => {
    const refresh = () => setItems(readCarts()[cartKey] ?? []);
    refresh();
    return subscribe(KEYS.carts, refresh);
  }, [cartKey]);

  const persist = useCallback(
    (next: CartItem[]) => {
      const carts = readCarts();
      carts[cartKey] = next;
      writeKey(KEYS.carts, carts);
      setItems(next);
    },
    [cartKey],
  );

  const sameKey = (a: CartItem, b: { productId: string; selectedColor?: string; selectedSize?: string }) =>
    a.productId === b.productId && (a.selectedColor ?? "") === (b.selectedColor ?? "") && (a.selectedSize ?? "") === (b.selectedSize ?? "");

  const add: CartContextValue["add"] = useCallback(
    (item) => {
      const current = readCarts()[cartKey] ?? [];
      const idx = current.findIndex((c) => sameKey(c, item));
      let next: CartItem[];
      if (idx >= 0) {
        next = [...current];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
      } else {
        next = [...current, item];
      }
      persist(next);
    },
    [cartKey, persist],
  );

  const remove: CartContextValue["remove"] = useCallback(
    (productId, color, size) => {
      const current = readCarts()[cartKey] ?? [];
      persist(current.filter((c) => !sameKey(c, { productId, selectedColor: color, selectedSize: size })));
    },
    [cartKey, persist],
  );

  const setQty: CartContextValue["setQty"] = useCallback(
    (productId, qty, color, size) => {
      if (qty <= 0) return remove(productId, color, size);
      const current = readCarts()[cartKey] ?? [];
      persist(
        current.map((c) =>
          sameKey(c, { productId, selectedColor: color, selectedSize: size }) ? { ...c, quantity: qty } : c,
        ),
      );
    },
    [cartKey, persist, remove],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add,
      remove,
      setQty,
      clear,
    }),
    [items, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}