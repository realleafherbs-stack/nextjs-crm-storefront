"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "דף הבית" },
  { href: "/shop", label: "המוצרים" },
  { href: "/compare", label: "השוואה" },
  { href: "/blog", label: "מדריכים" },
  { href: "/contact", label: "צור קשר" },
];

export default function InnerHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="inner-header">
      <div className="shell">
        <Link className="brand" href="/"><b>HTC</b><small>ISRAEL</small></Link>
        <nav id="infoNav" className={open ? "is-open" : undefined}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          id="infoMenuButton"
          type="button"
          aria-label="פתיחת תפריט"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
