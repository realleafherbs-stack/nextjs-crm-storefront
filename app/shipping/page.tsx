import type { Metadata } from "next";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "משלוחים והחזרות | HTC ישראל",
  description: "מידע על משלוחים, מעקב, החלפות והחזרות בהזמנות HTC ישראל.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <LegalPageLayout
      heroKicker="HTC ISRAEL · שירות מקומי"
      heroTitle="משלוחים והחזרות"
      heroSubtitle="כל מה שחשוב לדעת מרגע ההזמנה"
      heroVariant="shipping"
      toc={[
        { href: "#delivery", label: "זמני אספקה" },
        { href: "#cost", label: "עלות משלוח" },
        { href: "#tracking", label: "מעקב" },
        { href: "#returns", label: "החזרות" },
      ]}
    >
      <section id="delivery">
        <h2>זמני אספקה</h2>
        <p>משלוח עד הבית יגיע בדרך כלל בתוך 2–5 ימי עסקים ממועד אישור ההזמנה. יישובים מרוחקים, תקופות עומס או נסיבות שאינן בשליטתנו עשויים להאריך את זמן האספקה.</p>
      </section>
      <section id="cost">
        <h2>עלות משלוח</h2>
        <p>עלות המשלוח תוצג בסל לפני התשלום. הזמנות מעל הסכום המצוין באתר עשויות להיות זכאיות למשלוח חינם בהתאם למבצע הפעיל.</p>
      </section>
      <section id="tracking">
        <h2>מעקב אחר הזמנה</h2>
        <p>לאחר מסירת החבילה לחברת השליחויות יישלח עדכון עם פרטי המעקב. מומלץ לוודא שמספר הטלפון והכתובת הוזנו בצורה מלאה.</p>
      </section>
      <section id="returns">
        <h2>החלפה או החזרה</h2>
        <p>ניתן לפנות לשירות הלקוחות בתוך 14 ימים מקבלת המוצר. המוצר נדרש להיות שלם, ללא שימוש ובאריזה המקורית. לפני שליחת מוצר חזרה יש לקבל אישור והנחיות מהשירות.</p>
      </section>
      <section>
        <h2>מוצר פגום או הזמנה שגויה</h2>
        <p>במקרה של נזק במשלוח, חוסר או אי־התאמה, צרו איתנו קשר בהקדם וצירפו צילום של המוצר והאריזה כדי שנוכל לטפל במהירות.</p>
      </section>
    </LegalPageLayout>
  );
}
