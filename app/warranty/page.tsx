import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "אחריות ושירות | HTC ישראל",
  description: "אחריות ושירות למוצרי HTC ישראל — 12 חודשי אחריות יבואן רשמי, אופן הפעלת האחריות ויצירת קשר.",
  alternates: { canonical: "/warranty" },
};

export default function WarrantyPage() {
  return (
    <LegalPageLayout
      heroKicker="HTC ISRAEL · שירות מקומי"
      heroTitle="אחריות שאפשר לסמוך עליה"
      heroSubtitle="12 חודשי אחריות יבואן רשמי לכל מכשיר"
      toc={[
        { href: "#coverage", label: "מה כלול" },
        { href: "#service", label: "הפעלת אחריות" },
        { href: "#exclusions", label: "מה לא כלול" },
        { href: "#contact", label: "יצירת קשר" },
      ]}
    >
      <section id="coverage">
        <h2>12 חודשי אחריות בישראל</h2>
        <p>כל מכשיר HTC שנרכש באתר כולל 12 חודשי אחריות יבואן רשמי ממועד מסירת המוצר. האחריות מכסה פגם שמקורו בייצור, בחומרים או בהרכבה, בכפוף לתעודת האחריות ולהוראות השימוש.</p>
      </section>
      <section id="service">
        <h2>איך מפעילים אחריות?</h2>
        <p>פונים לשירות הלקוחות עם שם מלא, מספר הזמנה, דגם המכשיר ותיאור התקלה. מומלץ לצרף תמונה או סרטון קצר. לאחר בדיקה ראשונית תקבלו הנחיות למסירת המוצר לבדיקה, תיקון או החלפה בהתאם למקרה ולהוראות הדין.</p>
      </section>
      <section id="exclusions">
        <h2>מה אינו מכוסה?</h2>
        <p>בלאי סביר של להבים, רשתות, מסרקים ואביזרים מתכלים; שבר או נזק חיצוני; חדירת נוזלים שלא בהתאם לדירוג המוצר; שימוש בניגוד להוראות; אביזר או ספק כוח לא מתאים; ותיקון או פתיחה בידי גורם שאינו מורשה.</p>
        <p>הנוסח המלא בתעודת האחריות המצורפת למוצר הוא הקובע, ואין בתנאים אלה כדי לגרוע מזכויות הצרכן על פי דין.</p>
      </section>
      <section id="contact">
        <h2>אנחנו כאן לעזור</h2>
        <p>לשירות ואחריות פנו דרך <Link href="/contact">עמוד יצירת הקשר</Link> ובחרו בנושא "שירות ואחריות".</p>
      </section>
    </LegalPageLayout>
  );
}
