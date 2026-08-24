"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { formatPrice } from "../../lib/constants";

type Step = "shipping" | "payment";

interface CouponResult {
  code: string;
  type: string;
  value: number;
}

export default function CheckoutPage() {
  const { items, total } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const discount = appliedCoupon
    ? appliedCoupon.type === "PERCENT"
      ? Math.round(((total * appliedCoupon.value) / 100) * 100) / 100
      : Math.min(appliedCoupon.value, total)
    : 0;
  // Shipping is calculated from post-discount subtotal to match server-side logic (/api/hyp-checkout)
  const subtotalAfterDiscount = Math.max(0, total - discount);
  const shipping = subtotalAfterDiscount === 0 || subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 29;
  const finalTotal = subtotalAfterDiscount + shipping;

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

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CRM_URL}/api/${process.env.NEXT_PUBLIC_CRM_SITE_SLUG}/validate-coupon`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode }) }
      );
      const data = await res.json();
      if (!res.ok) setCouponError(data.error ?? "קוד קופון לא תקין");
      else {
        setAppliedCoupon(data);
        setCouponCode("");
      }
    } catch {
      setCouponError("שגיאה באימות הקופון");
    }
    setCouponLoading(false);
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
          coupon: appliedCoupon?.code,
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
          <div className="checkout-page__grid">
            <div>
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
                      <label>שם פרטי</label>
                      <input value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} />
                      {submitted && !form.firstName.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                    <div className="checkout-page__field">
                      <label>שם משפחה</label>
                      <input value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} />
                      {submitted && !form.lastName.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                  </div>
                  <div className="checkout-page__field">
                    <label>אימייל</label>
                    <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
                    {submitted && !form.email.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__field">
                    <label>טלפון</label>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
                    {submitted && !form.phone.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <h2>כתובת למשלוח</h2>
                  <div className="checkout-page__field">
                    <label>רחוב</label>
                    <input value={form.street} onChange={(e) => set("street")(e.target.value)} />
                    {submitted && !form.street.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__row">
                    <div className="checkout-page__field">
                      <label>מספר בית</label>
                      <input value={form.houseNumber} onChange={(e) => set("houseNumber")(e.target.value)} />
                      {submitted && !form.houseNumber.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                    <div className="checkout-page__field">
                      <label>דירה</label>
                      <input value={form.apartment} onChange={(e) => set("apartment")(e.target.value)} />
                      {submitted && !form.apartment.trim() && <p className="checkout-page__error">שדה חובה</p>}
                    </div>
                  </div>
                  <div className="checkout-page__field">
                    <label>עיר</label>
                    <input value={form.city} onChange={(e) => set("city")(e.target.value)} />
                    {submitted && !form.city.trim() && <p className="checkout-page__error">שדה חובה</p>}
                  </div>
                  <div className="checkout-page__field">
                    <label>הערות להזמנה (אופציונלי)</label>
                    <textarea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
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
                  <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>התשלום מאובטח באמצעות Hyp Pay</p>
                </div>
              )}
            </div>

            <aside className="cart-page__summary">
              <h2>סיכום הזמנה</h2>
              {items.map((item) => (
                <div className="cart-page__summary-row" key={item.id}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₪{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="cart-page__summary-row"><span>סכום ביניים</span><span>₪{formatPrice(total)}</span></div>
              {discount > 0 && (
                <div className="cart-page__summary-row"><span>הנחה ({appliedCoupon?.code})</span><span>-₪{formatPrice(discount)}</span></div>
              )}
              <div className="cart-page__summary-row"><span>משלוח</span><span>{shipping === 0 ? "חינם" : `₪${formatPrice(shipping)}`}</span></div>
              <div className="cart-page__summary-row cart-page__summary-row--total"><span>סה״כ</span><span>₪{formatPrice(finalTotal)}</span></div>

              {appliedCoupon ? (
                <p style={{ fontSize: "13px", color: "#347247" }}>✓ קוד {appliedCoupon.code} הוחל</p>
              ) : (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input
                    style={{ flex: 1, border: "1px solid var(--line)", padding: "10px 12px", fontSize: "13px" }}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="קוד קופון"
                  />
                  <button
                    type="button"
                    className="button button--ghost"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    disabled={couponLoading}
                    onClick={handleCoupon}
                  >
                    {couponLoading ? "…" : "החל"}
                  </button>
                </div>
              )}
              {couponError && <p className="checkout-page__error">{couponError}</p>}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
