"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

type MarketLead = {
  id: string;
  phone: string;
  comment: string | null;
  region: string | null;
  price: number;
  createdAt: string;
};

type CartItem = MarketLead;

type CartContextValue = {
  items: CartItem[];
  addItem: (lead: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (lead: CartItem) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === lead.id)) {
        return prev;
      }
      return [...prev, lead];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.price || 0), 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    clearCart,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};





