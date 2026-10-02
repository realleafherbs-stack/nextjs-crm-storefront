import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ Order?: string; reason?: string }>;
}) {
  const { Order: orderId = "", reason = "" } = await searchParams;
  const needsReview = Boolean(reason);

  return (
    <>
      <Navbar />
      <main id="main" className="payment-result">
        <div className="payment-result__card">
          <div className="payment-result__icon payment-result__icon--failure">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12"/></svg>
          </div>
          <h1>{needsReview ? "ההזמנה ממתינה לאימות" : "התשלום לא הושלם"}</h1>
          <p>
            {needsReview
              ? "קיבלנו חזרה מהסליקה, אך עדיין לא הצלחנו לאמת את ההזמנה. אם מופיע חיוב, אל תנסו לשלם שוב — נבדוק את העסקה מול חברת הסליקה."
              : "לא התקבלה השלמה להזמנה. אם מופיע חיוב בחשבון, אל תנסו לשלם שוב — נבדוק את העסקה מול חברת הסליקה."}
          </p>
          {orderId && (
            <div className="payment-result__summary">
              <div><span>מספר הזמנה</span><b>{orderId}</b></div>
            </div>
          )}
          <div className="payment-result__actions">
            {!needsReview && <Link className="button button--gold" href="/checkout">נסו שוב</Link>}
            <Link className="button button--ghost" href="/cart">חזרה לעגלה</Link>
          </div>
          <p className="payment-result__help">
            אם הבעיה חוזרת, <Link href="/contact">צרו קשר</Link> עם שירות הלקוחות שלנו.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
