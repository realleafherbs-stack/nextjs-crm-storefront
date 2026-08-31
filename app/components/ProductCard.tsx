"use client";

import Link from "next/link";
import { sendGTMEvent } from "@next/third-parties/google";
import { useCart } from "../context/CartContext";
import { productContent } from "../../lib/product-content";
import type { StoreProduct } from "../../lib/products-data";
import { formatPrice } from "../../lib/constants";

export default function ProductCard({ product, featured = false }: { product: StoreProduct; featured?: boolean }) {
  const { addItem } = useCart();

  const addToCart = () => {
    if (product.stock !== undefined && product.stock <= 0) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock });

    sendGTMEvent({ ecommerce: null });
    sendGTMEvent({
      event: "add_to_cart",
      ecommerce: {
        currency: "ILS",
        value: product.price,
        items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
      },
    });

    fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "AddToCart",
        value: product.price,
        contentId: product.id,
        contentName: product.name,
      }),
    }).catch(() => {});
  };
  const content = productContent[product.gtin];
  const compareAtPrice = content?.compareAtPrice;
  const discount = compareAtPrice ? Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100) : 0;
  const savings = compareAtPrice ? compareAtPrice - product.price : 0;
  const stock = product.stock ?? 999;
  const inStock = stock > 0;

  return (
    <article className={`product-card${featured ? " product-card--feature" : ""}`} data-category={product.category.slug}>
      <div className="product-card__media">
        {product.badge && <span className="tag">{product.badge}</span>}
        <img className="product-shot" src={product.image} loading="lazy" decoding="async" alt={product.name} />
      </div>
      <div className="product-card__body">
        <div>
          <small>{product.handle.toUpperCase()} · {product.category.name}</small>
          <h3>{product.name}</h3>
          <p className="product-card__features">{product.cardFeatures.join(" · ")}</p>
        </div>
        <div className="product-card__price">
          {compareAtPrice ? (
            <>
              <div className="price-offer__top"><span>מחיר השקה</span><b>{discount}% הנחה</b></div>
              <div className="price-offer__main">
                <strong><sup>₪</sup>{formatPrice(product.price)}</strong>
                <div><del>₪{formatPrice(compareAtPrice)}</del><small>חיסכון של ₪{formatPrice(savings)}</small></div>
              </div>
              <p>כולל מע״מ</p>
            </>
          ) : (
            <>
              <span>מחיר השקה</span>
              <strong>₪{formatPrice(product.price)}</strong>
            </>
          )}
        </div>
        <p className="product-card__warranty">12 חודשי אחריות יבואן רשמי</p>
        <div className="product-card__bottom">
          <b className={`availability ${inStock ? "is-in-stock" : "is-out-of-stock"}`}>{inStock ? "במלאי" : "אזל מהמלאי"}</b>
          <button
            className="add-button"
            type="button"
            disabled={!inStock}
            onClick={addToCart}
          >
            {inStock ? "הוספה לסל" : "אזל מהמלאי"} <span aria-hidden="true">+</span>
          </button>
          <Link className={`card-link${featured ? " card-link--gold" : ""}`} href={`/shop/${product.handle}`}>
            לפרטים
          </Link>
        </div>
      </div>
    </article>
  );
}
