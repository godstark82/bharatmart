"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  qty: number;
  image?: string;
  sellerId?: string;
};

type InquiryContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalQty: number;
  totalAmount: number;
};

const InquiryContext = createContext<InquiryContextType | null>(null);

const STORAGE_KEY = "bharatmart:cart";

export const InquiryProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: Omit<CartItem, "qty"> & { qty?: number }) => {
    const qty = Math.max(1, Number(item.qty ?? 1) || 1);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === item.productId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    const safeQty = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: safeQty } : i)));
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalQty = useMemo(() => items.reduce((sum, i) => sum + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.qty || 0), 0),
    [items]
  );

  return (
    <InquiryContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, totalQty, totalAmount }}
    >
      {children}
    </InquiryContext.Provider>
  );
};

export const useInquiry = () => {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error("useInquiry must be used inside InquiryProvider");
  }
  return context;
};
