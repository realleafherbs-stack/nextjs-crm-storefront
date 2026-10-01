import type { Metadata } from 'next'
import Link from 'next/link'
import BusinessPageShell from '../_BusinessPage'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function ApplicationReceivedPage() {
  return <BusinessPageShell><section className="business-application-received" aria-labelledby="application-received-title">
    <p className="kicker">HTC PRO לעסקים</p>
    <h1 id="application-received-title">הבקשה התקבלה</h1>
    <p>נבדוק את פרטי העסק ונשלח קישור להפעלת החשבון לאימייל לאחר אישור.</p>
    <div className="business-application-received__actions"><Link href="/shop" className="button button--gold">לגלוש בחנות</Link><Link href="/" className="button button--ghost">חזרה לאתר</Link></div>
    <Link href="/business/login" className="business-form__link">כבר יש לכם חשבון עסקי? לכניסה</Link>
  </section></BusinessPageShell>
}
