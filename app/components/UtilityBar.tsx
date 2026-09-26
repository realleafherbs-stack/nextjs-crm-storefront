import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/constants";

const tickerMessages = [
  "משלוח חינם בקנייה מעל ₪",
  "12 חודשי אחריות יבואן רשמי",
  "יבואן רשמי בישראל",
  "שירות לקוחות מקומי",
] as const;

function TickerSet() {
  return (
    <span className="utility-set" aria-hidden="true">
      {tickerMessages.map((message, index) => (
        <span className="utility-slide" key={message}>
          {index === 0 && (
            <svg viewBox="0 0 24 24">
              <path d="M3 6h11v10H3z" />
              <path d="M14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
          )}
          <b>{message}{index === 0 ? FREE_SHIPPING_THRESHOLD : ""}</b>
        </span>
      ))}
    </span>
  );
}

export default function UtilityBar() {
  return (
    <div className="utility" aria-label="הטבת משלוח">
      <div className="shell utility__inner">
        <Link
          className="utility-track"
          href="/shipping"
          aria-label={`משלוח חינם בקנייה מעל ₪${FREE_SHIPPING_THRESHOLD}, לפרטי משלוחים`}
        >
          <TickerSet />
          <TickerSet />
        </Link>
      </div>
    </div>
  );
}
