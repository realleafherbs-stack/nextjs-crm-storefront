'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BusinessOrderSummary } from '../../../lib/business-crm'
import { useBusinessCart } from '../../../lib/business-cart'
import { trackBusinessPurchase } from '../../../lib/business-analytics'

const statusLabels: Record<BusinessOrderSummary['status'], string> = {
  AWAITING_PAYMENT: 'ממתינה לתשלום', PAID: 'שולמה', FULFILLED: 'נשלחה / הושלמה', CANCELLED: 'בוטלה', PAYMENT_FAILED: 'התשלום נכשל',
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2 }).format(value)
}

export default function BusinessOrdersClient({ paymentConfirmed = false, confirmedOrder }: { paymentConfirmed?: boolean; confirmedOrder?: { orderId: string; amount: number } }) {
  const router = useRouter()
  const cart = useBusinessCart()
  const [orders, setOrders] = useState<BusinessOrderSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reordering, setReordering] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/business/orders', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('נדרש להתחבר לחשבון עסקי פעיל')
        return response.json() as Promise<{ orders: BusinessOrderSummary[] }>
      })
      .then(({ orders: result }) => setOrders(result))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'לא ניתן לטעון הזמנות'))
  }, [])

  // Wait for the order list so the push can carry the line items; if it cannot load, still report the sale.
  const confirmedOrderId = confirmedOrder?.orderId
  const confirmedAmount = confirmedOrder?.amount
  useEffect(() => {
    if (confirmedOrderId === undefined || confirmedAmount === undefined) return
    if (orders === null && !error) return
    const match = orders?.find((order) => order.id === confirmedOrderId)
    trackBusinessPurchase({ orderId: confirmedOrderId, amount: confirmedAmount, items: match?.items ?? [] })
  }, [confirmedOrderId, confirmedAmount, orders, error])

  async function reorder(orderId: string) {
    setReordering(orderId)
    try {
      const response = await fetch('/api/business/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
      const result = await response.json().catch(() => ({})) as { lines?: Array<{ productId: string; quantity: number }>; error?: string }
      if (!response.ok || !result.lines) throw new Error(result.error ?? 'לא ניתן לשחזר את ההזמנה')
      cart.replaceLines(result.lines)
      router.push('/business/cart')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'לא ניתן לשחזר את ההזמנה')
    } finally { setReordering(null) }
  }

  return <section className="business-account">
    <div className="business-account__heading"><div><p className="kicker">HTC PRO · חשבון עסקי</p><h1>ההזמנות שלך</h1></div><Link href="/business/catalog" className="button button--gold">להזמנה חדשה</Link></div>
    {paymentConfirmed && <p className="business-account__success" role="status">התשלום אומת וההזמנה העסקית אושרה. היא תופיע כאן לאחר רענון הרשימה.</p>}
    {error && <div className="business-account__empty"><h2>לא ניתן להציג את ההזמנות</h2><p>{error}</p><Link href="/business/login" className="button button--gold">כניסה לחשבון</Link></div>}
    {!error && orders === null && <p>טוענים הזמנות…</p>}
    {!error && orders?.length === 0 && <div className="business-account__empty"><h2>עדיין אין הזמנות עסקיות</h2><p>לאחר הזמנה מאושרת היא תופיע כאן, עם אפשרות להזמנה חוזרת.</p><Link href="/business/catalog" className="button button--gold">לקטלוג העסקי</Link></div>}
    {!error && orders?.map((order) => <article className="business-account__order" key={order.id}><header><div><small>{new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</small><h2>{order.id}</h2></div><span className={`business-account__status business-account__status--${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span></header><div className="business-account__items">{order.items.map((item) => <p key={item.productId}><span>{item.productName} × {item.quantity}</span><b>{formatPrice(item.lineGrossTotal)}</b></p>)}</div><footer><strong>{formatPrice(order.grossTotal)}</strong><button className="button button--ghost" type="button" disabled={reordering === order.id || !cart.ready} onClick={() => reorder(order.id)}>{reordering === order.id ? 'משחזרים…' : 'הזמנה חוזרת'}</button></footer></article>)}
  </section>
}
