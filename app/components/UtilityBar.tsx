import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_RATE } from "../../lib/constants";

const utilityItems = [
  { label: "קנייה מאובטחת", path: <><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="11" rx="2"/></> },
  { label: `משלוח ב־₪${STANDARD_SHIPPING_RATE} · חינם מ־₪${FREE_SHIPPING_THRESHOLD}`, path: <><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></> },
  { label: "12 חודשי אחריות", path: <><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></> },
  { label: "יבואן רשמי בישראל", path: <><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></> },
  { label: "שירות לקוחות מקומי", path: <><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/><path d="M17 19c-1 1.3-2.7 2-5 2"/></> },
];

function UtilitySet({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="utility-set" aria-hidden={ariaHidden}>
      {utilityItems.map((item, index) => (
        <span className="utility-slide" key={index}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{item.path}</svg>
          <b>{item.label}</b>
        </span>
      ))}
    </div>
  );
}

export default function UtilityBar() {
  return (
    <div className="utility" aria-label="יתרונות החנות">
      <div className="shell utility__inner">
        <div className="utility-track">
          <UtilitySet />
          <UtilitySet ariaHidden />
        </div>
      </div>
    </div>
  );
}
