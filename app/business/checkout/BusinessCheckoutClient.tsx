'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { BusinessCatalogItem, BusinessDeliveryInput, BusinessOrderLine } from '../../../lib/business-crm'
import { useBusinessCart } from '../../../lib/business-cart'

function formatPrice(value: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2 }).format(value)
}

const initialDelivery: BusinessDeliveryInput = { name: '', email: '', phone: '', street: '', houseNumber: '', apartment: '', city: '', notes: '' }

export function BusinessCheckoutClient({ initialLines, initialCatalog }: { initialLines?: BusinessOrderLine[]; initialCatalog?: BusinessCatalogItem[] }) {
  const cart = useBusinessCart()
  const lines = initialLines ?? cart.lines
  const [catalog, setCatalog] = useState<BusinessCatalogItem[] | null>(initialCatalog ?? null)
  const [delivery, setDelivery] = useState<BusinessDeliveryInput>(initialDelivery)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialCatalog !== undefined) return
    fetch('/api/business/catalog', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('לא ניתן לטעון את תנאי ההזמנה')
        return response.json() as Promise<{ items: BusinessCatalogItem[] }>
      })
      .then(({ items }) => setCatalog(items))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'לא ניתן לטעון את תנאי ההזמנה'))
  }, [initialCatalog])

  const products = useMemo(() => {
    const byId = new Map((catalog ?? []).map((item) => [item.productId, item]))
    return lines.flatMap((line) => {
      const product = byId.get(line.productId)
      return product ? [{ product, quantity: line.quantity }] : []
    })
  }, [catalog, lines])
  const netTotal = products.reduce((total, { product, quantity }) => total + product.netUnitPrice * quantity, 0)
  const grossTotal = products.reduce((total, { product, quantity }) => total + product.grossUnitPrice * quantity, 0)
  const valid = Boolean(delivery.name.trim() && delivery.email.trim() && delivery.phone.trim() && delivery.street.trim() && delivery.houseNumber.trim() && delivery.city.trim())
  const set = (field: keyof BusinessDeliveryInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDelivery((current) => ({ ...current, [field]: event.target.value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setError(null)
    if (!valid || !lines.length) return
    setLoading(true)
    try {
      const response = await fetch('/api/business/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines, delivery }) })
      const result = await response.json().catch(() => ({})) as { paymentUrl?: string; error?: string }
      if (!response.ok || !result.paymentUrl) throw new Error(result.error ?? 'לא ניתן לפתוח תשלום מאובטח')
      window.location.assign(result.paymentUrl)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'לא ניתן לפתוח תשלום מאובטח')
      setLoading(false)
    }
  }

  return <section className="business-checkout">
    <div className="business-checkout__heading"><div><p className="kicker">HTC PRO · הזמנה עסקית</p><h1>פרטי הזמנה ותשלום</h1></div><Link href="/business/cart" className="button button--ghost">חזרה לסל העסקי</Link></div>
    <div className="business-checkout__flow">
      <details className="business-checkout__summary">
        <summary><span><b>פירוט הזמנה</b><small>{lines.reduce((count, line) => count + line.quantity, 0)} יח׳ בהזמנה</small></span><strong>{formatPrice(grossTotal)}</strong><i aria-hidden="true">⌄</i></summary>
        <div>{products.map(({ product, quantity }) => <p key={product.productId}><span>{product.name} × {quantity}</span><b>{formatPrice(product.grossUnitPrice * quantity)}</b></p>)}<p><span>סה״כ לפני מע״מ</span><b>{formatPrice(netTotal)}</b></p><p className="business-checkout__summary-total"><span>סה״כ כולל מע״מ</span><b>{formatPrice(grossTotal)}</b></p></div>
      </details>
      <form className="business-checkout__form" onSubmit={submit} noValidate>
        <h2>פרטי משלוח</h2><p>המחירון והתנאים ייבדקו שוב בשרת לפני פתיחת התשלום.</p>
        <div className="business-checkout__fields">
          <label>שם מלא<input value={delivery.name} onChange={set('name')} autoComplete="name" />{submitted && !delivery.name.trim() && <small>שדה חובה</small>}</label>
          <label>אימייל<input type="email" value={delivery.email} onChange={set('email')} autoComplete="email" />{submitted && !delivery.email.trim() && <small>שדה חובה</small>}</label>
          <label>טלפון<input type="tel" value={delivery.phone} onChange={set('phone')} autoComplete="tel" />{submitted && !delivery.phone.trim() && <small>שדה חובה</small>}</label>
          <label>עיר<input value={delivery.city} onChange={set('city')} autoComplete="address-level2" />{submitted && !delivery.city.trim() && <small>שדה חובה</small>}</label>
          <label>רחוב<input value={delivery.street} onChange={set('street')} autoComplete="address-line1" />{submitted && !delivery.street.trim() && <small>שדה חובה</small>}</label>
          <label>מספר בית<input value={delivery.houseNumber} onChange={set('houseNumber')} autoComplete="address-line2" />{submitted && !delivery.houseNumber.trim() && <small>שדה חובה</small>}</label>
          <label>דירה <em>אופציונלי</em><input value={delivery.apartment ?? ''} onChange={set('apartment')} /></label>
          <label className="business-checkout__field--wide">הערה להזמנה <em>אופציונלי</em><textarea rows={3} value={delivery.notes ?? ''} onChange={set('notes')} /></label>
        </div>
        {!lines.length && <p className="business-checkout__error">הסל העסקי ריק. יש לבחור מוצרים לפני המעבר לתשלום.</p>}
        {error && <p className="business-checkout__error" role="alert">{error}</p>}
        <button className="button button--gold" type="submit" disabled={loading || !lines.length}>{loading ? 'מעבירים לתשלום…' : 'לתשלום מאובטח'}</button>
        <small className="business-checkout__secure">תשלום מאובטח באמצעות HYP.</small>
      </form>
    </div>
  </section>
}
