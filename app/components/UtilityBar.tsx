import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/constants";

export default function UtilityBar() {
  return (
    <div className="utility" aria-label="הטבת משלוח">
      <div className="shell utility__inner">
        <Link className="utility__shipping-offer" href="/shipping">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
          <span><b>משלוח חינם בקנייה מעל ₪{FREE_SHIPPING_THRESHOLD}</b></span>
          <small aria-hidden="true">לפרטים</small>
        </Link>
      </div>
    </div>
  );
}
