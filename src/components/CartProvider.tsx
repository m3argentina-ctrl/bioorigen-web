"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, Product } from "@/lib/types";
import { findVariant, lineKey, unitPriceOf } from "@/lib/variants";

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  subtotal: number;
  /** `key` es el resultado de lineKey(productId, variantId). */
  addItem: (product: Product, quantity?: number, variantId?: string | null) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  keyOf: (item: CartItem) => string;
  unitPrice: (item: CartItem) => number;
  variantLabel: (item: CartItem) => string | null;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bioorigen.cart";

function keyOf(item: CartItem): string {
  return lineKey(item.product.id, item.variantId);
}

/** Precio unitario real de la línea: respeta la medida elegida. */
function unitPrice(item: CartItem): number {
  return unitPriceOf(item.product, findVariant(item.product, item.variantId));
}

function variantLabel(item: CartItem): string | null {
  return findVariant(item.product, item.variantId)?.label ?? null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(product: Product, quantity = 1, variantId: string | null = null) {
    const key = lineKey(product.id, variantId);
    setItems((prev) => {
      const existing = prev.find((i) => keyOf(i) === key);
      if (existing) {
        return prev.map((i) =>
          keyOf(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { product, quantity, variantId }];
    });
    setIsOpen(true);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => keyOf(i) !== key));
  }

  function setQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    setItems((prev) => prev.map((i) => (keyOf(i) === key ? { ...i, quantity } : i)));
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);

  const value: CartContextValue = {
    items,
    isOpen,
    count,
    subtotal,
    addItem,
    removeItem,
    setQuantity,
    keyOf,
    unitPrice,
    variantLabel,
    clear: () => setItems([]),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
