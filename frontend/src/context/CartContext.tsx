'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import type { CartItem, Product } from '@/types';

const STORAGE_KEY = 'footwear-cart';

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number, color?: string | null) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  removeItem: (productId: number, size: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The cart lives in a small localStorage-backed external store. Reading it
 * through useSyncExternalStore (instead of a hydrate-on-mount effect) is the
 * SSR-safe pattern: the server snapshot is always empty, so hydration never
 * mismatches, and the client swaps to the stored cart right after. It also
 * keeps carts in sync across browser tabs via the `storage` event.
 */

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    // ignore corrupted storage
    return [];
  }
}

let cart: CartItem[] = readStoredCart();
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

function setCart(next: CartItem[] | ((prev: CartItem[]) => CartItem[])): void {
  cart = typeof next === 'function' ? (next as (prev: CartItem[]) => CartItem[])(cart) : next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota errors
  }
  emitChange();
}

function onStorage(event: StorageEvent): void {
  if (event.key === STORAGE_KEY) {
    cart = readStoredCart();
    emitChange();
  }
}

function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getCartSnapshot(): CartItem[] {
  return cart;
}

// Stable reference — useSyncExternalStore requires the server snapshot to be
// cached, otherwise React warns about an infinite loop.
const EMPTY_CART: CartItem[] = [];

function getCartServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);

  const addItem: CartContextValue['addItem'] = useCallback(
    (product, size, quantity = 1, color) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id && i.size === size);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && i.size === size
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [...prev, { product, size, color: color ?? null, quantity }];
      });
    },
    [],
  );

  const updateQuantity: CartContextValue['updateQuantity'] = useCallback(
    (productId, size, quantity) => {
      setCart((prev) =>
        quantity <= 0
          ? prev.filter((i) => !(i.product.id === productId && i.size === size))
          : prev.map((i) =>
              i.product.id === productId && i.size === size ? { ...i, quantity } : i,
            ),
      );
    },
    [],
  );

  const removeItem: CartContextValue['removeItem'] = useCallback((productId, size) => {
    setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const clearCart: CartContextValue['clearCart'] = useCallback(() => {
    setCart([]);
  }, []);

  const { totalItems, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const unitPrice = item.product.discountPrice ?? item.product.regularPrice;
        return {
          totalItems: acc.totalItems + item.quantity,
          subtotal: acc.subtotal + unitPrice * item.quantity,
        };
      },
      { totalItems: 0, subtotal: 0 },
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
