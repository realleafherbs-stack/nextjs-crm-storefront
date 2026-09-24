"use client";

import { useEffect } from "react";
import { useCart } from "../context/CartContext";

export default function CartToast() {
  const { toast, dismissToast, isPanelOpen } = useCart();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, 3000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast || isPanelOpen) return null;

  return (
    <div
      className="cart-toast is-visible"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="cart-toast__message">
        <span className="cart-toast__icon" aria-hidden="true">✓</span>
        {toast.message}
      </span>
      {toast.actionLabel && toast.onAction && (
        <button
          className="cart-toast__action"
          type="button"
          onClick={() => {
            toast.onAction?.();
            dismissToast();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  );
}
