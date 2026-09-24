import Link from "next/link";

export default function InnerFooter() {
  return (
    <footer className="inner-footer">
      <div className="shell">
        <Link className="brand brand--footer" href="/"><b>HTC</b><small>ISRAEL</small></Link>
        <nav>
          <Link href="/privacy">פרטיות</Link>
          <Link href="/terms">תקנון</Link>
          <Link href="/shipping">משלוחים</Link>
          <Link href="/blog">מדריכים</Link>
          <Link href="/accessibility">נגישות</Link>
          <Link href="/contact">צור קשר</Link>
        </nav>
        <span>© 2026 HTC ישראל</span>
      </div>
    </footer>
  );
}
