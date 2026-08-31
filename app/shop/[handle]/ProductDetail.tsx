"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sendGTMEvent } from "@next/third-parties/google";
import { useCart } from "../../context/CartContext";
import { WARRANTY_FAQ_ANSWER, type ProductContent } from "../../../lib/product-content";
import type { StoreProduct } from "../../../lib/products-data";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "../../../lib/constants";

const noteIcons = [
  <svg key="0" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 17h6"/></svg>,
  <svg key="1" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v13H7zM9 4h6v3M10 11h4M12 9v4"/></svg>,
  <svg key="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14M9 5v14M13 5v14M17 5v14M21 5v14"/><path d="M3 19h18"/></svg>,
];

export default function ProductDetail({
  product,
  content,
  related,
}: {
  product: StoreProduct;
  content: ProductContent;
  related: StoreProduct[];
}) {
  const { addItem, openPanel } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mobileAdded, setMobileAdded] = useState(false);

  const gallery = product.images.slice(0, 3);
  const discount = Math.round(((content.compareAtPrice - product.price) / content.compareAtPrice) * 100);
  const savings = content.compareAtPrice - product.price;
  const isFlagship = product.handle === "at-799";
  const stock = product.stock ?? 999;
  const inStock = stock > 0;

  useEffect(() => {
    sendGTMEvent({ ecommerce: null });
    sendGTMEvent({
      event: "view_item",
      ecommerce: {
        currency: "ILS",
        value: product.price,
        items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const addToCart = () => {
    if (!inStock) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, stock }, quantity);

    sendGTMEvent({ ecommerce: null });
    sendGTMEvent({
      event: "add_to_cart",
      ecommerce: {
        currency: "ILS",
        value: product.price * quantity,
        items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }],
      },
    });

    fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "AddToCart",
        value: product.price * quantity,
        contentId: product.id,
        contentName: product.name,
      }),
    }).catch(() => {});
  };

  const buyNow = () => {
    addToCart();
    openPanel();
  };

  const handleMobileAdd = () => {
    addToCart();
    setMobileAdded(true);
    window.setTimeout(() => setMobileAdded(false), 1400);
  };

  return (
    <>
      <div className="shell breadcrumb">
        <Link href="/shop">← חזרה לחנות</Link>
        <span>דף הבית / כל הדגמים / {product.name}</span>
      </div>

      <section className="product-detail shell">
        <div className="product-gallery">
          <div className="gallery-thumbs" aria-label="תמונות מוצר">
            {gallery.map((src, index) => (
              <button
                key={src}
                className={index === activeImage ? "is-active" : undefined}
                type="button"
                aria-label={`הצגת תמונה ${index + 1} של ${product.name}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={src} loading="lazy" decoding="async" alt={`תמונה ${index + 1} של ${product.name}`} />
              </button>
            ))}
          </div>
          <div className="gallery-main">
            <img id="mainProductImage" src={gallery[activeImage]} alt={`${product.name} — ${content.subtitle}`} />
          </div>
        </div>

        <div className="product-info">
          <span className="product-info__eyebrow">{content.story.eyebrow}</span>
          <h1>{product.name}</h1>
          <h2>{content.subtitle}</h2>
          <div className="product-meta">
            <span>דגם / מק״ט: {product.handle.toUpperCase()}</span>
            <span>ברקוד: {product.gtin}</span>
          </div>
          <p>{content.description}</p>
          <div className={`stock ${inStock ? "stock--available" : "stock--empty"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="10"/></svg>
            <span>{inStock ? <><b>במלאי</b><small>מוכן למשלוח מהיר</small></> : <b>אזל מהמלאי</b>}</span>
          </div>
          <div className="product-hold">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
            <span className="product-price-offer">
              <small>מחיר השקה · <del>₪{formatPrice(content.compareAtPrice)}</del></small>
              <strong>₪{formatPrice(product.price)}</strong>
              <em>חיסכון ₪{formatPrice(savings)}</em>
              <p>המחיר כולל מע״מ · משלוח חינם בקנייה מעל ₪{FREE_SHIPPING_THRESHOLD}</p>
            </span>
          </div>
          <div className="product-quantity">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V3m8 4V3M5 11h14M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"/></svg>
              כמות
            </span>
            <div>
              <button type="button" aria-label="הפחתת כמות" disabled={quantity === 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <b>{quantity}</b>
              <button type="button" aria-label="הגדלת כמות" disabled={quantity >= Math.min(10, stock)} onClick={() => setQuantity((q) => Math.min(10, stock, q + 1))}>+</button>
            </div>
          </div>
          <div className="product-actions-live">
            <button className="product-add" type="button" onClick={addToCart} disabled={!inStock}>
              <span className="product-add__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
              </span>
              <span>{inStock ? "הוספה לסל" : "אזל מהמלאי"}</span>
            </button>
            <button className="buy-now" type="button" onClick={buyNow} disabled={!inStock}>
              <span>קנייה עכשיו</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
            </button>
          </div>
          <div className="product-notes" aria-label="יתרונות מרכזיים">
            {content.notes.map((note, index) => (
              <span key={note}>{noteIcons[index] ?? noteIcons[0]}<b>{note}</b></span>
            ))}
          </div>
        </div>
      </section>

      <ul className="product-proof-row shell" aria-label="שירות ואיכות בקצרה">
        <li><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7 3v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-5"/></svg></b><span><strong>מוצר מקורי</strong><small>יבוא רשמי לישראל</small></span></li>
        <li><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 1 7 7v5a3 3 0 0 1-3 3h-1v-6h4M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-6H5"/><path d="M15 20h-3"/></svg></b><span><strong>12 חודשי אחריות</strong><small>יבואן רשמי · שירות בישראל</small></span></li>
        <li><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg></b><span><strong>משלוח מהיר</strong><small>אריזה בטוחה עד הבית</small></span></li>
        <li><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 9.7 8.1 4 9l4 4-.9 6 4.9-2.7L17 19l-1-6 4-4-5.7-.9L12 3Z"/></svg></b><span><strong>בחירה מקצועית</strong><small>דגמים שנבחרו בקפידה</small></span></li>
      </ul>

      <section className="product-benefits">
        <div className="shell">
          {content.story.benefits.map(([title, text], index) => (
            <article key={title}><b>{`0${index + 1}`}</b><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="product-spec-panel" aria-labelledby="productSpecTitle">
        <div className="shell product-spec-panel__layout">
          <div className="product-spec-panel__heading">
            <p className="kicker">המפרט החשוב. בלי רעש.</p>
            <h2 id="productSpecTitle">כל הנתונים<br />במבט אחד.</h2>
            <p>מידע ברור בעברית שיעזור לכם לדעת בדיוק מה מקבלים.</p>
            <span>{product.name} · {product.handle.toUpperCase().replace("-", "‑")}</span>
            <small className="spec-verification">נבדק מול מסמכי הספק ותכולת האריזה</small>
          </div>
          <dl className="product-spec-grid">
            {content.specs.map(([label, value], index) => (
              <div key={label}>
                <span>{`0${index + 1}`}</span>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="product-story shell" data-model={product.handle.toUpperCase()}>
        <div className="product-story__image">
          <img src={gallery[2] ?? gallery[1] ?? gallery[0]} alt={`${product.name} בסביבת מספרה מקצועית`} />
        </div>
        <div>
          <p className="kicker kicker--dark">{product.name.toUpperCase()}</p>
          <h2>{content.story.headline}</h2>
          <p>{content.story.body}</p>
          <ul>
            {[...content.notes, "אחריות ושירות בישראל"].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {isFlagship && (
        <section className="product-editorial" aria-label={`פרטי ${product.name}`}>
          <div className="shell product-editorial__intro">
            <p className="kicker kicker--dark">הנדסה מדויקת</p>
            <h2>דיוק בכל פרט.</h2>
            <p>מבט מקרוב על הגימור, השליטה והלהב.</p>
          </div>
          <div className="shell product-editorial__grid">
            <figure>
              <img src="/assets/optimized/at799-detail-screen.jpg" loading="lazy" decoding="async" alt="מסך LCD וחוגת הכיוון של HTC One Pro" />
              <figcaption><b>שליטה מדויקת</b><span>חוגת כיוון ומסך LCD ברור בזמן העבודה.</span></figcaption>
            </figure>
            <figure>
              <img src="/assets/barbershop/at-799-action.jpg" alt="תקריב להב HTC One Pro" />
              <figcaption><b>להב מקצועי</b><span>מבנה רחב לחיתוך נקי, רציף ואחיד.</span></figcaption>
            </figure>
            <figure>
              <img src="/assets/optimized/at799-finishes.jpg" loading="lazy" decoding="async" alt="שתי גרסאות גימור של HTC One Pro" />
              <figcaption><b>גימור מתכתי</b><span>נוכחות מקצועית ואחיזה מאוזנת ביד.</span></figcaption>
            </figure>
          </div>
        </section>
      )}

      <section className="faq product-source-details">
        <div className="shell">
          <h2>כל מה שצריך לדעת</h2>
          <details open>
            <summary><span className="detail-summary-label"><b>01</b><span>מפרט וביצועים</span></span></summary>
            <p>{content.description} תכונות מרכזיות: {content.notes.join(" · ")}.</p>
          </details>
          <details>
            <summary><span className="detail-summary-label"><b>02</b><span>מה מגיע באריזה?</span></span></summary>
            <p>{content.boxContents}</p>
          </details>
          <details>
            <summary><span className="detail-summary-label"><b>03</b><span>טעינה וזמן עבודה</span></span></summary>
            <p>{content.powerInfo}</p>
          </details>
          <details>
            <summary><span className="detail-summary-label"><b>04</b><span>אחריות ושירות</span></span></summary>
            <p>{WARRANTY_FAQ_ANSWER}</p>
          </details>
        </div>
      </section>

      <section className="related section">
        <div className="shell">
          <div className="why__heading"><h2>דגמים נוספים בסדרה</h2></div>
          <div className="related-grid">
            {related.map((item) => (
              <Link key={item.id} href={`/shop/${item.handle}`}>
                <img src={item.image} loading="lazy" decoding="async" alt={item.name} />
                <b>{item.name}</b>
                <span>לצפייה בדגם ←</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-buy-bar" aria-label="רכישה מהירה">
        <div><small>{inStock ? "במלאי" : "אזל מהמלאי"} · <span>₪{formatPrice(product.price)}</span></small><strong>{product.name}</strong></div>
        <button type="button" onClick={handleMobileAdd} disabled={!inStock}>
          <span>{!inStock ? "אזל מהמלאי" : mobileAdded ? "נוסף לסל ✓" : "הוספה לסל"}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        </button>
      </div>
    </>
  );
}
