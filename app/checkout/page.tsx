"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { formatPrice } from "../../lib/constants";

type Step = "shipping" | "payment";

export default function CheckoutPage() {
  const { items, total } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = total === 0 || total >= FREE_SHIPPING_THRESHOLD ? 0 : 29;
  const finalTotal = total + shipping;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    street: "", houseNumber: "", apartment: "", city: "", notes: "",
  });

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const isShippingValid =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    form.phone.trim() && form.street.trim() && form.houseNumber.trim() &&
    form.apartment.trim() && form.city.trim();

  const handleContinue = () => {
    setSubmitted(true);
    if (isShippingValid) setStep("payment");
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const fullAddress = `${form.street} ${form.houseNumber}${form.apartment ? ` דירה ${form.apartment}` : ""}`;
      // No price/amount fields here — /api/hyp-checkout recomputes the
      // total server-side from CRM product data (Task 20). finalTotal above
      // is display-only, for the summary the customer sees before paying.
      const res = await fetch("/api/hyp-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { ...form, address: fullAddress },
          items: items.map((i) => ({ id: i.id, qty: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "שגיאה בחיבור לשער התשלומים");
        setLoading(false);
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError("שגיאה בחיבור לשער התשלומים. אנא נסו שוב.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main id="main" className="cart-page">
          <div className="shell">
            <h1>קופה</h1>
            <div className="cart-page__empty">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span>
              <h2>הסל ריק</h2>
              <p>הוסיפו מוצרים לסל כדי להמשיך לתשלום.</p>
              <Link className="button button--gold" href="/shop">לכל הדגמים</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main id="main" className="checkout-page">
        <div className="shell">
          <h1>קופה</h1>
          <div className="checkout-page__flow">
            <details className="checkout-page__order-summary">
              <summary>
                <span className="checkout-page__order-summary-title">
                  <b>פירוט הזמנה</b>
                  <small>{itemCount} {itemCount === 1 ? "פריט" : "פריטים"}</small>
                </span>
                <strong>₪{formatPrice(finalTotal)}</strong>
                <span className="checkout-page__order-summary-arrow" aria-hidden="true">⌄</span>
              </summary>
              <div className="checkout-page__order-summary-body">
                {items.map((item) => (
                  <div className="checkout-page__order-item" key={item.id}>
                    <span>{item.name} × {item.quantity}</span>
                    <b>₪{formatPrice(item.price * item.quantity)}</b>
                  </div>
                ))}
                <div className="checkout-page__order-row"><span>סכום ביניים</span><b>₪{formatPrice(total)}</b></div>
                <div className="checkout-page__order-row"><span>משלוח</span><b>{shipping === 0 ? "חינם" : `₪${formatPrice(shipping)}`}</b></div>
                <div className="checkout-page__order-row checkout-page__order-row--total"><span>סה״כ</span><b>₪{formatPrice(finalTotal)}</b></div>
              </div>
            </details>

            <div className="checkout-page__steps">
              <div className="checkout-page__tabs">
                <button type="button" className={step === "shipping" ? "is-active" : undefined} onClick={() => setStep("shipping")}>
                  פרטי משלוח
                </button>
                <button type="button" className={step === "payment" ? "is-active" : undefined} disabled={!isShippingValid} onClick={() => setStep("payment")}>
                  תשלום
                </button>
              </div>

              {step === "shipping" && (
                <div className="checkout-page__panel">
                  <h2>פרטים אישיים</h2>
                  <div className="checkout-page__row">
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-first-name">שם פרטי</label>
                      <input id="checkout-first-name" autoComplete="given-name" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} />
                      {submitted && !form.firstName.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-last-name">שם משפחה</label>
                      <input id="checkout-last-name" autoComplete="family-name" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} />
                      {submitted && !form.lastName.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                  </div>
                  <div className="checkout-page__field">
                    <label htmlFor="checkout-email">אימייל</label>
                    <input id="checkout-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
                    {submitted && !form.email.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__field">
                    <label htmlFor="checkout-phone">טלפון</label>
                    <input id="checkout-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
                    {submitted && !form.phone.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <h2>כתובת למשלוח</h2>
                  <div className="checkout-page__field">
                    <label htmlFor="checkout-street">רחוב</label>
                    <input id="checkout-street" autoComplete="address-line1" value={form.street} onChange={(e) => set("street")(e.target.value)} />
                    {submitted && !form.street.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__row">
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-house-number">מספר בית</label>
                      <input id="checkout-house-number" value={form.houseNumber} onChange={(e) => set("houseNumber")(e.target.value)} />
                      {submitted && !form.houseNumber.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-apartment">דירה</label>
                      <input id="checkout-apartment" value={form.apartment} onChange={(e) => set("apartment")(e.target.value)} />
                      {submitted && !form.apartment.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                  </div>
                  <div className="checkout-page__field">
                    <label htmlFor="checkout-city">עיר</label>
                    <input id="checkout-city" autoComplete="address-level2" value={form.city} onChange={(e) => set("city")(e.target.value)} />
                    {submitted && !form.city.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__field">
                    <label htmlFor="checkout-notes">הערות להזמנה (אופציונלי)</label>
                    <textarea id="checkout-notes" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
                  </div>
                  <button className="button button--gold" type="button" onClick={handleContinue}>
                    המשך לתשלום
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="checkout-page__panel">
                  <h2>תשלום מאובטח</h2>
                  <div className="checkout-page__recap">
                    <div className="checkout-page__recap-row"><span>שם</span><b>{form.firstName} {form.lastName}</b></div>
                    <div className="checkout-page__recap-row"><span>אימייל</span><b>{form.email}</b></div>
                    <div className="checkout-page__recap-row">
                      <span>כתובת</span>
                      <b>{form.street} {form.houseNumber}{form.apartment ? ` דירה ${form.apartment}` : ""}, {form.city}</b>
                    </div>
                    <button type="button" className="card-link" onClick={() => setStep("shipping")}>עריכת פרטים</button>
                  </div>
                  {error && <p className="checkout-page__error">{error}</p>}
                  <button className="button button--gold" type="button" disabled={loading} onClick={handlePay}>
                    {loading ? "מעבד…" : "לתשלום מאובטח"}
                  </button>
                  <p className="checkout-page__secure-note">התשלום מאובטח באמצעות Hyp Pay</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
