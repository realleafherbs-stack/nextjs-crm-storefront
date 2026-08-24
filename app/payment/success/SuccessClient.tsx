"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../../lib/constants";

export default function SuccessClient({ orderId, amount }: { orderId: string; amount: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
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
    }
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
