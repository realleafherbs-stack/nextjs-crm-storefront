"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { formatPrice } from "../../lib/constants";

export default function Cart() {
  const { items, total, count, isPanelOpen, closePanel, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const percent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <>
      <aside className={`cart${isPanelOpen ? " is-open" : ""}`} aria-hidden={!isPanelOpen} aria-label="סל קניות">
        <div className="cart__head">
          <div>
            <small>{count ? `${count} ${count === 1 ? "פריט" : "פריטים"} בסל` : "הבחירה שלכם"}</small>
            <h2>סל הקניות</h2>
          </div>
          <button onClick={closePanel} aria-label="סגירת הסל">×</button>
        </div>
        <div className="cart__items">
          {items.length === 0 ? (
            <div className="cart__empty">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span>
              <h3>הסל מחכה לבחירה שלכם</h3>
              <p>מצאו את מכשיר הטיפוח שמתאים בדיוק לשגרה שלכם.</p>
              <Link href="/shop" onClick={closePanel}>לכל הדגמים <b>←</b></Link>
            </div>
          ) : (
            items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item__thumb">
                  {item.image ? <img src={item.image} alt="" /> : "HTC"}
                </div>
                <div className="cart-item__content">
                  <span>HTC ישראל · יבואן רשמי</span>
                  <h3>{item.name}</h3>
                  <small>₪{formatPrice(item.price)}</small>
                  <div className="cart-item__quantity">
                    <button aria-label="הפחתת כמות" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <b>{item.quantity}</b>
                    <button aria-label="הגדלת כמות" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button className="cart-item__remove" aria-label={`הסרת ${item.name}`} onClick={() => removeItem(item.id)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>
                </button>
              </article>
            ))
          )}
        </div>
        <div className="cart__foot" hidden={items.length === 0}>
          <div className="shipping-progress">
            <p>{remaining ? <>נשארו <b>₪{formatPrice(remaining)}</b> למשלוח חינם</> : <b>הרווחתם משלוח חינם</b>}</p>
            <i><span style={{ width: `${percent}%` }}></span></i>
          </div>
          <div>
            <span>סה״כ</span>
            <b>₪{formatPrice(total)}</b>
          </div>
          <button type="button" onClick={() => { closePanel(); router.push("/cart"); }}>
            להמשך ההזמנה <span>←</span>
          </button>
          <small>משלוח חינם בקנייה מעל ₪{FREE_SHIPPING_THRESHOLD}</small>
        </div>
      </aside>
      <button className="scrim" aria-label="סגירה" hidden={!isPanelOpen} onClick={closePanel}></button>
    </>
  );
}
