"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";

const navLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/shop", label: "החנות" },
  { href: "/compare", label: "השוואת דגמים" },
  { href: "/blog", label: "מדריכים" },
  { href: "/#service", label: "אחריות ושירות" },
  { href: "/contact", label: "צור קשר" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openPanel } = useCart();
  const pathname = usePathname();

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
      </div>
    </header>
  );
}
