"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { calculateShipping, formatPrice } from "../../lib/constants";

type Step = "shipping" | "payment";

const requiredFields = [
  { key: "firstName", id: "checkout-first-name" },
  { key: "lastName", id: "checkout-last-name" },
  { key: "email", id: "checkout-email" },
  { key: "phone", id: "checkout-phone" },
  { key: "street", id: "checkout-street" },
  { key: "houseNumber", id: "checkout-house-number" },
  { key: "apartment", id: "checkout-apartment" },
  { key: "city", id: "checkout-city" },
] as const;

export default function CheckoutPage() {
  const { items, total } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = calculateShipping(total);
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

  const isFieldMissing = (key: keyof typeof form) => submitted && !form[key].trim();

  const handleContinue = () => {
    setSubmitted(true);
    if (!isShippingValid) {
      const firstMissingField = requiredFields.find(({ key }) => !form[key].trim());
      document.getElementById(firstMissingField?.id ?? "checkout-first-name")?.focus();
      return;
    }
    setStep("payment");
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
                    <div className={`checkout-page__field${isFieldMissing("firstName") ? " checkout-page__field--invalid" : ""}`}>
                      <label htmlFor="checkout-first-name">שם פרטי</label>
                      <input id="checkout-first-name" required autoComplete="given-name" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} aria-invalid={isFieldMissing("firstName")} aria-describedby={isFieldMissing("firstName") ? "checkout-first-name-error" : undefined} />
                      {isFieldMissing("firstName") && <p id="checkout-first-name-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                    </div>
                    <div className={`checkout-page__field${isFieldMissing("lastName") ? " checkout-page__field--invalid" : ""}`}>
                      <label htmlFor="checkout-last-name">שם משפחה</label>
                      <input id="checkout-last-name" required autoComplete="family-name" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} aria-invalid={isFieldMissing("lastName")} aria-describedby={isFieldMissing("lastName") ? "checkout-last-name-error" : undefined} />
                      {isFieldMissing("lastName") && <p id="checkout-last-name-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                    </div>
                  </div>
                  <div className={`checkout-page__field${isFieldMissing("email") ? " checkout-page__field--invalid" : ""}`}>
                    <label htmlFor="checkout-email">אימייל</label>
                    <input id="checkout-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={isFieldMissing("email")} aria-describedby={isFieldMissing("email") ? "checkout-email-error" : undefined} />
                    {isFieldMissing("email") && <p id="checkout-email-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                  </div>
                  <div className={`checkout-page__field${isFieldMissing("phone") ? " checkout-page__field--invalid" : ""}`}>
                    <label htmlFor="checkout-phone">טלפון</label>
                    <input id="checkout-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} aria-invalid={isFieldMissing("phone")} aria-describedby={isFieldMissing("phone") ? "checkout-phone-error" : undefined} />
                    {isFieldMissing("phone") && <p id="checkout-phone-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                  </div>
                  <h2>כתובת למשלוח</h2>
                  <div className={`checkout-page__field${isFieldMissing("street") ? " checkout-page__field--invalid" : ""}`}>
                    <label htmlFor="checkout-street">רחוב</label>
                    <input id="checkout-street" required autoComplete="address-line1" value={form.street} onChange={(e) => set("street")(e.target.value)} aria-invalid={isFieldMissing("street")} aria-describedby={isFieldMissing("street") ? "checkout-street-error" : undefined} />
                    {isFieldMissing("street") && <p id="checkout-street-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__row">
                    <div className={`checkout-page__field${isFieldMissing("houseNumber") ? " checkout-page__field--invalid" : ""}`}>
                      <label htmlFor="checkout-house-number">מספר בית</label>
                      <input id="checkout-house-number" required autoComplete="address-line2" value={form.houseNumber} onChange={(e) => set("houseNumber")(e.target.value)} aria-invalid={isFieldMissing("houseNumber")} aria-describedby={isFieldMissing("houseNumber") ? "checkout-house-number-error" : undefined} />
                      {isFieldMissing("houseNumber") && <p id="checkout-house-number-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                    </div>
                    <div className={`checkout-page__field${isFieldMissing("apartment") ? " checkout-page__field--invalid" : ""}`}>
                      <label htmlFor="checkout-apartment">דירה</label>
                      <input id="checkout-apartment" required value={form.apartment} onChange={(e) => set("apartment")(e.target.value)} aria-invalid={isFieldMissing("apartment")} aria-describedby={isFieldMissing("apartment") ? "checkout-apartment-error" : undefined} />
                      {isFieldMissing("apartment") && <p id="checkout-apartment-error" className="checkout-page__error" role="alert">שדה חובה</p>}
                    </div>
                  </div>
                  <div className={`checkout-page__field${isFieldMissing("city") ? " checkout-page__field--invalid" : ""}`}>
                    <label htmlFor="checkout-city">עיר</label>
                    <input id="checkout-city" required autoComplete="address-level2" value={form.city} onChange={(e) => set("city")(e.target.value)} aria-invalid={isFieldMissing("city")} aria-describedby={isFieldMissing("city") ? "checkout-city-error" : undefined} />
                    {isFieldMissing("city") && <p id="checkout-city-error" className="checkout-page__error" role="alert">שדה חובה</p>}
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
