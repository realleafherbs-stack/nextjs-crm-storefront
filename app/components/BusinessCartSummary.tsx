'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { BusinessCatalogItem } from '../../lib/business-crm'
import { reconcileBusinessCart, useBusinessCart } from '../../lib/business-cart'

function formatPrice(value: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2 }).format(value)
}

export default function BusinessCartSummary() {
  const cart = useBusinessCart()
  const [catalog, setCatalog] = useState<BusinessCatalogItem[] | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/business/catalog', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('לא ניתן לטעון את ההזמנה העסקית')
        return response.json() as Promise<{ items: BusinessCatalogItem[] }>
      })
      .then(({ items }) => setCatalog(items))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'לא ניתן לטעון את ההזמנה העסקית'))
  }, [])

  useEffect(() => {
    if (!catalog || !cart.ready) return
    const reconciled = reconcileBusinessCart(cart.lines, catalog)
    if (reconciled.removedProductIds.length) setNotice('מוצר שלא זמין יותר הוסר מההזמנה. המחירים והתנאים נטענו מחדש.')
    if (JSON.stringify(reconciled.lines) !== JSON.stringify(cart.lines)) cart.replaceLines(reconciled.lines)
  }, [catalog, cart])

  const products = useMemo(() => {
    const indexed = new Map((catalog ?? []).map((item) => [item.productId, item]))
    return cart.lines.flatMap((line) => {
      const product = indexed.get(line.productId)
      return product ? [{ product, quantity: line.quantity }] : []
    })
  }, [catalog, cart.lines])
  const netTotal = products.reduce((total, { product, quantity }) => total + product.netUnitPrice * quantity, 0)
  const grossTotal = products.reduce((total, { product, quantity }) => total + product.grossUnitPrice * quantity, 0)

  return <section className="business-cart-summary" aria-busy={catalog === null && !error}>
    <div className="business-cart-summary__heading"><div><p className="kicker">HTC PRO · הזמנה עסקית</p><h1>הסל העסקי שלך</h1></div><Link href="/business/catalog" className="business-cart-summary__return"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg><span>חזרה לקטלוג</span></Link></div>
    {notice && <p className="business-cart-summary__notice" role="status">{notice}</p>}
    {error && <div className="business-cart-summary__empty"><h2>נדרשת כניסה לחשבון עסקי</h2><p>{error}</p><Link href="/business/login" className="button button--gold">כניסה לחשבון</Link></div>}
    {!error && catalog === null && <p>טוענים את תנאי ההזמנה המעודכנים…</p>}
    {!error && catalog !== null && products.length === 0 && <div className="business-cart-summary__empty"><h2>הסל העסקי עדיין ריק</h2><p>בחרו מוצרים מהקטלוג המאושר לעסק שלכם.</p><Link href="/business/catalog" className="button button--gold">לקטלוג העסקי</Link></div>}
    {!error && products.length > 0 && <><div className="business-cart-summary__lines">{products.map(({ product, quantity }, index) => <article key={product.productId}><div>{product.image ? <Image src={product.image} alt={product.imageAlt ?? product.name} width={80} height={80} sizes="80px" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} /> : null}<div><small>{product.sku ?? product.handle.toUpperCase()}</small><h2>{product.name}</h2><span>{formatPrice(product.netUnitPrice)} לפני מע״מ ליחידה</span></div></div><div className="business-cart-summary__line-controls"><button type="button" onClick={() => cart.updateLine(product.productId, quantity - product.quantityIncrement)} disabled={quantity <= product.minQuantity}>−</button><b>{quantity}</b><button type="button" onClick={() => cart.updateLine(product.productId, quantity + product.quantityIncrement)}>+</button><button className="business-cart-summary__remove" type="button" aria-label={`הסרת ${product.name} מהסל`} title={`הסרת ${product.name} מהסל`} onClick={() => cart.removeLine(product.productId)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13"/></svg></button></div><strong>{formatPrice(product.grossUnitPrice * quantity)}</strong></article>)}</div><aside className="business-cart-summary__totals"><div><span>סה״כ לפני מע״מ</span><b>{formatPrice(netTotal)}</b></div><div><span>סה״כ כולל מע״מ</span><strong>{formatPrice(grossTotal)}</strong></div><Link href="/business/checkout" className="button button--gold">המשך לפרטי הזמנה</Link><small>המחיר, המלאי ותנאי המינימום נבדקים שוב לפני אישור ההזמנה.</small></aside></>}
  </section>
}
