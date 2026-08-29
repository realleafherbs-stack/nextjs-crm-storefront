"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/constants";

export { FREE_SHIPPING_THRESHOLD };

const STORAGE_KEY = "htc-israel-cart-v2";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  image?: string;
}

interface Toast {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  toast: Toast | null;
  dismissToast: () => void;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (item): item is CartItem =>
        item && typeof item.id === "string" && typeof item.name === "string" &&
        Number(item.price) >= 0 && Number(item.quantity) > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);
  const dismissToast = () => setToast(null);

  const addItem: CartContextType["addItem"] = (item, quantity = 1) => {
    const amount = Math.max(1, Math.floor(quantity));
    const cap = item.stock ?? Infinity;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(cap, i.quantity + amount) } : i));
      }
      return [...prev, { ...item, quantity: Math.min(cap, amount) }];
    });
    setToast({ message: `נוסף לסל: ${item.name}`, actionLabel: "לצפייה בסל", onAction: openPanel });
  };

  const removeItem = (id: string) => {
    const removed = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (removed) {
      setToast({
        message: "המוצר הוסר מהסל",
        actionLabel: "ביטול",
        onAction: () => setItems((prev) => [...prev, removed]),
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, i.stock ?? Infinity) } : i)));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items, addItem, removeItem, updateQuantity, clearCart, total, count,
        toast, dismissToast, isPanelOpen, openPanel, closePanel,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
