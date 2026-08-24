"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { formatPrice } from "../../lib/constants";

export default function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const shipping = total === 0 || total >= FREE_SHIPPING_THRESHOLD ? 0 : 29;

  return (
    <>
      <Navbar />
      <main id="main" className="cart-page">
        <div className="shell">
          <h1>סל הקניות</h1>
          {items.length === 0 ? (
            <div className="cart-page__empty">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span>
              <h2>הסל ריק</h2>
              <p>מצאו את מכשיר הטיפוח שמתאים בדיוק לשגרה שלכם.</p>
              <Link className="button button--gold" href="/shop">לכל הדגמים</Link>
            </div>
          ) : (
            <div className="cart-page__grid">
              <div className="cart-page__list">
                {items.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-item__thumb">{item.image ? <img src={item.image} alt="" /> : "HTC"}</div>
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
                ))}
              </div>
              <aside className="cart-page__summary">
                <h2>סיכום הזמנה</h2>
                <div className="cart-page__summary-row"><span>סכום ביניים</span><span>₪{formatPrice(total)}</span></div>
                <div className="cart-page__summary-row"><span>משלוח</span><span>{shipping === 0 ? "חינם" : `₪${formatPrice(shipping)}`}</span></div>
                <div className="cart-page__summary-row cart-page__summary-row--total"><span>סה״כ</span><span>₪{formatPrice(total + shipping)}</span></div>
                <button className="button button--gold" type="button" onClick={() => router.push("/checkout")}>
                  להמשך לתשלום <span>←</span>
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
