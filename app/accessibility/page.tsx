import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "הצהרת נגישות | HTC ישראל",
  description: "הצהרת הנגישות של אתר HTC ישראל והדרכים לפנות בנושא נגישות.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      heroKicker="HTC ISRAEL · אתר לכולם"
      heroTitle="הצהרת נגישות"
      heroSubtitle="מחויבים לחוויית שימוש נגישה"
      toc={[
        { href: "#commitment", label: "המחויבות שלנו" },
        { href: "#features", label: "התאמות" },
        { href: "#limits", label: "מגבלות" },
        { href: "#contact-access", label: "יצירת קשר" },
      ]}
    >
      <section id="commitment">
        <h2>המחויבות שלנו</h2>
        <p>HTC ישראל פועלת לאפשר לאנשים עם מוגבלות להשתמש באתר באופן עצמאי, מכובד ושוויוני. אנו משקיעים בשיפור מתמשך בהתאם להנחיות הנגישות המקובלות ולדרישות הדין.</p>
      </section>
      <section id="features">
        <h2>התאמות שבוצעו באתר</h2>
        <ul>
          <li>מבנה כותרות וסדר ניווט ברור.</li>
          <li>תמיכה בניווט באמצעות מקלדת.</li>
          <li>טקסט חלופי לתמונות מוצר מרכזיות.</li>
          <li>ניגודיות צבעים ברורה ומצבי מיקוד גלויים.</li>
          <li>התאמה למסכים ולרמות הגדלה שונות.</li>
          <li>צמצום תנועה למשתמשים שבחרו בכך במערכת ההפעלה.</li>
        </ul>
      </section>
      <section id="limits">
        <h2>מגבלות ידועות</h2>
        <p>ייתכן שחלק מחומרי המדיה הישנים או מסמכים שמקורם בצד שלישי טרם הונגשו באופן מלא. אנו פועלים לתקן פערים ככל שהם מתגלים.</p>
      </section>
      <section id="contact-access">
        <h2>פנייה בנושא נגישות</h2>
        <p>נתקלתם בקושי? כתבו לנו דרך <Link href="/contact">עמוד יצירת הקשר</Link> וציינו באיזה עמוד נתקלתם בבעיה, באיזה מכשיר ודפדפן השתמשתם ומה הפעולה שניסיתם לבצע.</p>
      </section>
    </LegalPageLayout>
  );
}
