"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useBusinessCart } from "../../lib/business-cart";
import type { BusinessCatalogItem } from "../../lib/business-crm";

const navLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/shop", label: "החנות" },
  { href: "/compare", label: "השוואת דגמים" },
  { href: "/blog", label: "מדריכים" },
  { href: "/#service", label: "אחריות ושירות" },
  { href: "/contact", label: "צור קשר" },
  { href: "/business", label: "לקוחות עסקיים" },
];

function formatBusinessCartTotal(value: number) {
  return `₪${value.toFixed(2)}`;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openPanel } = useCart();
  const pathname = usePathname();
  const businessCart = useBusinessCart();
  const isBusinessArea = pathname?.startsWith("/business");
  const businessItemCount = businessCart.lines.reduce((total, line) => total + line.quantity, 0);
  const [businessCartTotal, setBusinessCartTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!isBusinessArea || !businessCart.ready) {
      setBusinessCartTotal(null);
      return;
    }
    if (!businessCart.lines.length) {
      setBusinessCartTotal(0);
      return;
    }
    let active = true;
    fetch("/api/business/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load business prices");
        return response.json() as Promise<{ items: BusinessCatalogItem[] }>;
      })
      .then(({ items }) => {
        if (!active) return;
        const prices = new Map(items.map((item) => [item.productId, item.grossUnitPrice]));
        setBusinessCartTotal(businessCart.lines.reduce((total, line) => total + (prices.get(line.productId) ?? 0) * line.quantity, 0));
      })
      .catch(() => {
        if (active) setBusinessCartTotal(null);
      });
    return () => {
      active = false;
    };
  }, [businessCart.lines, businessCart.ready, isBusinessArea]);

  return (
    <header className="site-header">
      <div className="shell header__inner">
        <button
          className="icon-button menu-button"
          type="button"
          aria-label="פתיחת תפריט"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span></span><span></span><span></span>
        </button>
        <Link className="brand" href="/" aria-label="HTC ישראל, דף הבית">
          <b>HTC</b><small>ISRAEL</small>
        </Link>
        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} id="mainNav" aria-label="ניווט ראשי">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={!link.href.includes("#") && pathname === link.href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {isBusinessArea ? (
          <Link
            className={`cart-button business-cart-button${businessItemCount > 0 ? " has-items" : ""}`}
            href="/business/cart"
            aria-label={`לסל העסקי, ${businessItemCount} פריטים${businessCartTotal !== null && businessItemCount ? `, סך הכול ${formatBusinessCartTotal(businessCartTotal)}` : ""}`}
          >
            <svg aria-hidden="true"><use href="#icon-bag" /></svg>
            <span>סל עסקי</span>
            <b>{businessItemCount}</b>
            {businessCartTotal !== null && businessItemCount > 0 ? <strong className="business-cart-button__total">{formatBusinessCartTotal(businessCartTotal)}</strong> : null}
          </Link>
        ) : (
          <button
            className={`cart-button${count > 0 ? " has-items" : ""}`}
            type="button"
            aria-label={count ? `פתיחת סל הקניות, ${count} פריטים` : "פתיחת סל הקניות"}
            onClick={openPanel}
          >
            <svg aria-hidden="true"><use href="#icon-bag" /></svg>
            <span>סל</span>
            <b>{count}</b>
          </button>
        )}
      </div>
      {!isBusinessArea ? (
        <Link
          className="mobile-business-ribbon"
          href="/business"
          aria-label="לקוחות עסקיים: מחירי יבואן והזמנה ישירה"
          onClick={() => setMenuOpen(false)}
        >
          <span className="shell mobile-business-ribbon__content">
            <b>לקוחות עסקיים?</b>
            <span>מחירי יבואן והזמנה ישירה</span>
            <i aria-hidden="true">←</i>
          </span>
        </Link>
      ) : null}
    </header>
  );
}
