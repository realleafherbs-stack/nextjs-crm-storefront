'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import BusinessProductCard, { type BusinessCatalogViewItem } from '../../components/BusinessProductCard'
import { trackBusinessEvent } from '../../../lib/business-analytics'
import { useBusinessCart } from '../../../lib/business-cart'
import type { BusinessCatalogItem } from '../../../lib/business-crm'

export default function BusinessCatalogClient({ catalog: providedCatalog }: { catalog?: BusinessCatalogViewItem[] }) {
  const [catalog, setCatalog] = useState<BusinessCatalogViewItem[] | null>(providedCatalog ?? null)
  const [error, setError] = useState<string | null>(null)
  const cart = useBusinessCart()

  useEffect(() => {
    if (providedCatalog !== undefined) return
    fetch('/api/business/catalog', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'נדרש אישור לחשבון עסקי' : 'לא ניתן לטעון את הקטלוג העסקי')
        return response.json() as Promise<{ items: BusinessCatalogItem[] }>
      })
      .then(({ items }) => {
        setCatalog(items)
        trackBusinessEvent('b2b_catalog_view')
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'לא ניתן לטעון את הקטלוג העסקי'))
  }, [providedCatalog])

  const isGuestCatalog = catalog?.some((item) => typeof item.netUnitPrice !== 'number') ?? false
  return <section className="business-catalog" aria-busy={catalog === null && !error}>
    <div className="business-catalog__heading"><div><p className="kicker">HTC PRO · ישירות מהיבואן</p><h1>הקטלוג העסקי</h1><p>המלאי, המחירים ותנאי המינימום מחוברים לחשבון העסקי שלך ומתעדכנים בזמן אמת.</p></div>{!isGuestCatalog && !error && <Link href="/business/cart" className="button button--gold">הסל העסקי{cart.ready && cart.lines.length ? ` · ${cart.lines.length}` : ''}</Link>}</div>
    {error && <div className="business-catalog__gate"><b>מחיר עסקי לאחר אישור</b><p>{error}. לקוחות מאושרים רואים מחירון מותאם ויכולים לבצע הזמנה ישירה מהיבואן.</p><div><Link href="/business/login" className="button button--gold">כניסה לחשבון עסקי</Link><Link href="/business/apply" className="button button--ghost">בקשה לחשבון</Link></div></div>}
    {!error && catalog === null && <p className="business-catalog__loading">טוענים את הקטלוג העסקי המאושר…</p>}
    {!error && catalog !== null && <div className="business-catalog__grid">{catalog.map((product) => <BusinessProductCard key={product.productId} product={product} onAdd={cart.addLine} />)}</div>}
  </section>
}
