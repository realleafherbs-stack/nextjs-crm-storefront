'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { trackBusinessApplySuccess } from '../../lib/business-analytics'
import { collectCampaignParams } from '../../lib/campaign-attribution'

async function requestJson(path: string, method: 'POST' | 'PUT', body: Record<string, unknown>) {
  const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({})) as { error?: string; ok?: boolean; applicationId?: string | number }
  if (!response.ok || data.error) throw new Error(data.error ?? 'לא ניתן להשלים את הפעולה כעת')
  return data
}

export async function requestBusinessReset(email: string): Promise<{ ok: true }> {
  await requestJson('/api/business/password-reset', 'POST', { email })
  // Deliberately identical for known and unknown addresses.
  return { ok: true }
}

function FormMessage({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p role="alert" className="business-form__message business-form__message--error">{error}</p>
  if (success) return <p role="status" className="business-form__message business-form__message--success">{success}</p>
  return null
}

export function BusinessApplicationForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true); setError(null)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      const fields = Object.fromEntries(form)
      const result = await requestJson('/api/business/apply', 'POST', { ...fields, attribution: collectCampaignParams() })
      // Only reached once the CRM has saved the application (requestJson throws otherwise).
      if (result.applicationId !== undefined) trackBusinessApplySuccess(String(result.applicationId), String(fields.businessType))
      router.replace('/business/application-received')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'לא ניתן לשלוח את הבקשה')
    } finally { setPending(false) }
  }

  return (
    <form className="business-form" onSubmit={submit}>
      <h1>בקשה לחשבון עסקי</h1>
      <p>הגישה נפתחת לאחר אישור ידני של היבואן. המחירון העסקי יופיע רק בחשבון מאושר.</p>
      <div className="business-form__grid">
        <label>שם העסק<input name="businessName" required autoComplete="organization" /></label>
        <label>שם מלא<input name="contactName" required autoComplete="name" /></label>
        <label>אימייל עסקי<input name="email" type="email" required autoComplete="email" /></label>
        <label>טלפון<input name="phone" type="tel" required autoComplete="tel" /></label>
        <label>סוג העסק<select name="businessType" required defaultValue=""><option value="" disabled>בחירה</option><option value="BARBER">ברבר / מספרה</option><option value="SALON">סלון יופי</option><option value="RETAILER">חנות</option><option value="DISTRIBUTOR">מפיץ</option><option value="OTHER">אחר</option></select></label>
        <label>עיר<input name="city" required autoComplete="address-level2" /></label>
        <label>ע.מ. / ח.פ. <small>חובה</small><input name="businessIdentifier" inputMode="numeric" required /></label>
        <label>אתר או אינסטגרם <small>אופציונלי</small><input name="website" type="url" /></label>
      </div>
      <label>הערה <small>אופציונלי</small><textarea name="notes" rows={3} /></label>
      <FormMessage error={error} success={null} />
      <button className="button button--gold" disabled={pending}>{pending ? 'שולחים…' : 'שליחת בקשה'}</button>
    </form>
  )
}

export function BusinessLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null)
    const form = new FormData(event.currentTarget)
    try {
      await requestJson('/api/business/login', 'POST', { email: form.get('email'), password: form.get('password') })
      window.location.assign('/business/catalog')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'לא ניתן להתחבר') } finally { setPending(false) }
  }
  return <form className="business-form business-form--narrow" onSubmit={submit}><h1>כניסה ללקוחות עסקיים</h1><p>הזמינו ישירות מהיבואן לפי המחירון שאושר לעסק שלכם.</p><label>אימייל<input name="email" type="email" required autoComplete="email" /></label><label>סיסמה<input name="password" type="password" required autoComplete="current-password" /></label><FormMessage error={error} success={null} /><button className="button button--gold" disabled={pending}>{pending ? 'מתחברים…' : 'כניסה לחשבון'}</button><Link className="business-form__link" href="/business/forgot-password">שכחתם סיסמה?</Link></form>
}

export function BusinessActivationForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null)
    const form = new FormData(event.currentTarget)
    try { await requestJson('/api/business/activate', 'POST', { token, password: form.get('password') }); window.location.assign('/business/catalog') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'לא ניתן להפעיל את החשבון') } finally { setPending(false) }
  }
  if (!token) return <div className="business-form business-form--narrow"><h1>קישור לא תקין</h1><p>יש לפתוח את קישור ההפעלה שנשלח אליכם.</p></div>
  return <form className="business-form business-form--narrow" onSubmit={submit}><h1>הפעלת חשבון עסקי</h1><p>בחרו סיסמה של 8 תווים לפחות. הקישור הוא חד־פעמי.</p><label>סיסמה חדשה<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label><FormMessage error={error} success={null} /><button className="button button--gold" disabled={pending}>{pending ? 'מפעילים…' : 'הפעלת חשבון'}</button></form>
}

export function BusinessForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  return <form className="business-form business-form--narrow" onSubmit={async (event) => { event.preventDefault(); setPending(true); setError(null); try { await requestBusinessReset(email); setSuccess('אם קיים חשבון עסקי לכתובת הזו, נשלח קישור לאיפוס סיסמה.') } catch { setError('לא ניתן להשלים את הבקשה כרגע') } finally { setPending(false) } }}><h1>איפוס סיסמה</h1><p>נשלח קישור חד־פעמי רק אם הכתובת משויכת לחשבון עסקי.</p><label>אימייל<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" /></label><FormMessage error={error} success={success} /><button className="button button--gold" disabled={pending}>{pending ? 'שולחים…' : 'שליחת קישור'}</button></form>
}

export function BusinessResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  return <form className="business-form business-form--narrow" onSubmit={async (event) => { event.preventDefault(); setPending(true); setError(null); const form = new FormData(event.currentTarget); try { await requestJson('/api/business/password-reset', 'PUT', { token, password: form.get('password') }); setSuccess('הסיסמה עודכנה. אפשר להתחבר לחשבון העסקי.') } catch (reason) { setError(reason instanceof Error ? reason.message : 'לא ניתן לעדכן סיסמה') } finally { setPending(false) } }}><h1>בחירת סיסמה חדשה</h1><label>סיסמה חדשה<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label><FormMessage error={error} success={success} /><button className="button button--gold" disabled={pending}>{pending ? 'מעדכנים…' : 'עדכון סיסמה'}</button>{success && <Link className="business-form__link" href="/business/login">לכניסה לחשבון</Link>}</form>
}

export default function BusinessLandingClient() {
  // Campaign URLs land here; hold the UTM/fbclid values for the apply form.
  useEffect(() => { collectCampaignParams() }, [])
  return (
    <main className="business-landing">
      <section className="business-landing__hero">
        <div className="business-landing__content">
          <p className="kicker">HTC PRO לעסקים</p>
          <h1>מחירי יבואן. מוצרים מקצועיים. הזמנה ישירה לעסק.</h1>
          <p>פותחים חשבון עסקי ומקבלים גישה למחירים מיוחדים, מלאי זמין והזמנות במקום אחד.</p>
          <div className="business-landing__actions">
            <Link href="/business/apply" className="button button--gold">פתיחת חשבון עסקי</Link>
            <Link href="/business/login" className="button button--ghost">כניסה ללקוחות עסקיים</Link>
          </div>
        </div>
        <figure className="business-landing__visual">
          <img src="/assets/barbershop/at-799-barbershop.jpg" alt="מכונת תספורת מקצועית HTC" />
        </figure>
      </section>
      <section className="business-landing__steps" aria-label="איך זה עובד">
        <article><b>01</b><h2>פותחים חשבון</h2><p>כמה פרטים קצרים ומגישים בקשה.</p></article>
        <article><b>02</b><h2>מקבלים אישור</h2><p>לאחר האישור נפתחת גישה למחירים העסקיים.</p></article>
        <article><b>03</b><h2>מזמינים לעסק</h2><p>בוחרים מוצרים ומזמינים ישירות מהיבואן.</p></article>
      </section>
    </main>
  )
}
