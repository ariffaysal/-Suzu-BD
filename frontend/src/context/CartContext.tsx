'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addItem: CartContextValue['addItem'] = (product, size, quantity = 1, color) => {
    setItems((prev) => {
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
  };

  const updateQuantity: CartContextValue['updateQuantity'] = (productId, size, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !(i.product.id === productId && i.size === size))
        : prev.map((i) =>
            i.product.id === productId && i.size === size ? { ...i, quantity } : i,
          ),
    );
  };

  const removeItem: CartContextValue['removeItem'] = (productId, size) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  };

  const clearCart = () => setItems([]);

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
