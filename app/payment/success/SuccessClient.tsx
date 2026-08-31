"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { sendGTMEvent } from "@next/third-parties/google";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../../lib/constants";

export default function SuccessClient({ orderId, amount }: { orderId: string; amount: string }) {
  const { items, total, hydrated, clearCart } = useCart();
  const fired = useRef(false);

  useEffect(() => {
    // Cart state loads from localStorage in CartProvider's own effect, which
    // (per React's child-before-parent effect ordering) runs AFTER this
    // component's effect on first mount — reading items/total here without
    // waiting for hydration would report an empty items array and value=0.
    if (!hydrated || fired.current) return;
    fired.current = true;

    // Backup — the server-side finalize in page.tsx's initial load is the
    // primary path, but if that request never completed (browser closed
    // mid-redirect, etc.), this fires once the page actually renders.
    // Idempotent server-side.
    if (orderId) {
      fetch("/api/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});

      const orderTotal = Number(amount) || total;
      const contentIds = items.map((i) => i.id);

      sendGTMEvent({ ecommerce: null });
      sendGTMEvent({
        event: "purchase",
        ecommerce: {
          transaction_id: orderId,
          currency: "ILS",
          value: orderTotal,
          items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
        },
      });

      fetch("/api/meta-capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "Purchase", value: orderTotal, orderId, contentIds }),
      }).catch(() => {});
    }

    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <div className="payment-result__card">
      <div className="payment-result__icon payment-result__icon--success">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12.75 6 6 9-13.5"/></svg>
      </div>
      <h1>ההזמנה אושרה!</h1>
      <p>תודה על הרכישה. אישור הזמנה יישלח לכתובת המייל שלכם.</p>
      {(orderId || amount) && (
        <div className="payment-result__summary">
          {orderId && <div><span>מספר הזמנה</span><b>{orderId}</b></div>}
          {amount && <div><span>סכום שחויב</span><b>₪{formatPrice(Number(amount))}</b></div>}
        </div>
      )}
      <div className="payment-result__actions">
        <Link className="button button--gold" href="/shop">המשך לקנות</Link>
        <Link className="button button--ghost" href="/">דף הבית</Link>
      </div>
    </div>
  );
}
