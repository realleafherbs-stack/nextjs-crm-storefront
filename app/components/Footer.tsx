import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer__grid">
        <div>
          <Link className="brand brand--footer" href="/"><b>HTC</b><small>ISRAEL</small></Link>
          <p>מכונות מקצועיות. שירות בישראל.</p>
        </div>
        <div>
          <h3>הקולקציה</h3>
          <Link href="/shop">לכל הדגמים</Link>
          <Link href="/compare">השוואת דגמים</Link>
          <Link href="/blog">מדריכים מקצועיים</Link>
        </div>
        <div>
          <h3>המותג</h3>
          <Link href="/#about">HTC בעולם</Link>
          <Link href="/#one-pro">האיכות המקצועית</Link>
          <Link href="/contact">לשותפים עסקיים</Link>
        </div>
        <div>
          <h3>שירות</h3>
          <Link href="/shipping">משלוחים</Link>
          <Link href="/shipping">החזרות והחלפות</Link>
          <Link href="/#service">אחריות</Link>
          <Link href="/contact">שאלות נפוצות</Link>
        </div>
      </div>
      <div className="shell footer__bottom">
        <span>© 2026 HTC ISRAEL · יבוא ושיווק: B2B MARKT LTD</span>
        <span>
          המרכבה 25, חולון · <Link href="/terms">תקנון</Link> ·{" "}
          <Link href="/privacy">מדיניות פרטיות</Link> ·{" "}
          <Link href="/accessibility">הצהרת נגישות</Link>
        </span>
      </div>
    </footer>
  );
}
