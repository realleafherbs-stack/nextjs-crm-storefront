"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { sendGTMEvent } from "@next/third-parties/google";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../../lib/constants";

export default function SuccessClient({ orderId, amount, verified, business = false }: { orderId: string; amount: string; verified: boolean; business?: boolean }) {
  const { items, total, hydrated, clearCart } = useCart();
  const fired = useRef(false);

  useEffect(() => {
    // Cart state loads from localStorage in CartProvider's own effect, which
    // (per React's child-before-parent effect ordering) runs AFTER this
    // component's effect on first mount — reading items/total here without
    // waiting for hydration would report an empty items array and value=0.
    if (!hydrated || !verified || business || !orderId || fired.current) return;
    fired.current = true;

    const orderTotal = Number(amount) || total;
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

    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, verified, business, orderId]);

  if (!verified) {
    return (
      <div className="payment-result__card">
        <div className="payment-result__icon payment-result__icon--failure">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </div>
        <h1>לא נמצא אישור תשלום</h1>
        <p>כדי להגן על ההזמנה, עמוד זה מוצג רק לאחר אימות מאובטח מול חברת הסליקה.</p>
        <div className="payment-result__actions"><Link className="button button--gold" href="/cart">חזרה לסל</Link></div>
      </div>
    );
  }

  return (
    <div className="payment-result__card">
      <div className="payment-result__icon payment-result__icon--success">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12.75 6 6 9-13.5"/></svg>
      </div>
      <h1>{business ? 'ההזמנה העסקית אושרה!' : 'ההזמנה אושרה!'}</h1>
      <p>{business ? 'אפשר לצפות בהזמנה ולעדכן את הפרטים באזור העסקי.' : 'תודה על הרכישה. אישור הזמנה יישלח לכתובת המייל שלכם.'}</p>
      {(orderId || amount) && (
        <div className="payment-result__summary">
          {orderId && <div><span>מספר הזמנה</span><b>{orderId}</b></div>}
          {amount && <div><span>סכום שחויב</span><b>₪{formatPrice(Number(amount))}</b></div>}
        </div>
      )}
      <div className="payment-result__actions">
        <Link className="button button--gold" href={business ? "/business/account" : "/shop"}>{business ? 'לאזור העסקי' : 'המשך לקנות'}</Link>
        <Link className="button button--ghost" href={business ? "/business/catalog" : "/"}>{business ? 'לקטלוג העסקי' : 'דף הבית'}</Link>
      </div>
    </div>
  );
}
