'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useBusinessCart } from '../../../../lib/business-cart'
import type { BusinessCatalogItem } from '../../../../lib/business-crm'
import { getProductManual } from '../../../../lib/product-manuals'
import { genericProductContent, productContent } from '../../../../lib/product-content'
import { products as retailProducts } from '../../../../lib/products-data'
import type { BusinessCatalogViewItem } from '../../../components/BusinessProductCard'

function formatPrice(value: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2 }).format(value)
}

function isWholesalerPriceVisible(product: BusinessCatalogViewItem): product is BusinessCatalogItem {
  return typeof product.netUnitPrice === 'number' && typeof product.vatRate === 'number' && typeof product.grossUnitPrice === 'number'
}

function maximumQuantity(product: BusinessCatalogViewItem) {
  const stockCap = product.stock === null ? Number.POSITIVE_INFINITY : Math.max(0, product.stock)
  const termCap = product.maxQuantity === null ? Number.POSITIVE_INFINITY : Math.max(0, product.maxQuantity)
  return Math.min(stockCap, termCap)
}

export default function BusinessProductDetailClient({ handle, catalog: providedCatalog }: { handle: string; catalog?: BusinessCatalogViewItem[] }) {
  const [catalog, setCatalog] = useState<BusinessCatalogViewItem[] | null>(providedCatalog ?? null)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)
  const cart = useBusinessCart()

  useEffect(() => {
    if (providedCatalog !== undefined) return
    fetch('/api/business/catalog', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'נדרש אישור לחשבון עסקי' : 'לא ניתן לטעון את המוצר העסקי')
        return response.json() as Promise<{ items: BusinessCatalogItem[] }>
      })
      .then(({ items }) => setCatalog(items))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'לא ניתן לטעון את המוצר העסקי'))
  }, [providedCatalog])

  const product = catalog?.find((candidate) => candidate.handle === handle)
  const retailProduct = useMemo(() => retailProducts.find((candidate) => candidate.handle === handle), [handle])
  const content = retailProduct ? productContent[retailProduct.gtin] ?? genericProductContent(retailProduct) : product ? genericProductContent({ name: product.name, price: product.grossUnitPrice ?? 0, cardFeatures: [] }) : null
  const gallery = useMemo(() => [...new Set([...(retailProduct?.images ?? []), product?.image].filter((image): image is string => Boolean(image)))], [product?.image, retailProduct])
  const minimum = product ? Math.max(1, product.minQuantity) : 1
  const maximum = product ? maximumQuantity(product) : 0
  const quantityStep = Math.max(1, product?.quantityIncrement ?? 1)
  const available = maximum >= minimum
  const pricedProduct = product && isWholesalerPriceVisible(product) ? product : null
  const hasPrice = Boolean(pricedProduct)
  const manual = product ? getProductManual(product.handle) : null

  useEffect(() => {
    setActiveImage(0)
    setQuantity(minimum)
    setFeedback(null)
  }, [handle, minimum])

  if (catalog === null && !error) return <section className="business-product-detail business-product-detail--loading" aria-busy="true">טוענים את פרטי המוצר העסקי…</section>

  if (error) return <section className="business-product-detail"><div className="business-product-detail__gate"><p className="kicker">HTC PRO · לקוחות עסקיים</p><h1>המחיר העסקי נפתח לאחר אישור</h1><p>{error}. התחברו לחשבון העסקי כדי לראות מחיר, מלאי ותנאי הזמנה מותאמים.</p><div><Link className="button button--gold" href="/business/login">כניסה לחשבון עסקי</Link><Link className="button button--ghost" href="/business/apply">פתיחת חשבון עסקי</Link></div></div></section>

  if (!product || !content) return <section className="business-product-detail"><div className="business-product-detail__gate"><h1>המוצר אינו זמין בקטלוג העסקי</h1><p>ייתכן שהדגם אינו מאושר לחשבון שלך או שאינו זמין כרגע.</p><Link className="button button--gold" href="/business/catalog">חזרה לקטלוג העסקי</Link></div></section>

  function changeQuantity(direction: 1 | -1) {
    setQuantity((current) => Math.max(minimum, Math.min(maximum, current + direction * quantityStep)))
  }

  return <section className="business-product-detail">
    <nav className="business-product-detail__breadcrumb" aria-label="פירורי לחם"><Link href="/business/catalog">חזרה לקטלוג העסקי</Link><span>קטלוג עסקי / {product.name}</span></nav>
    <article className="business-product-detail__main">
      <div className="business-product-detail__gallery" aria-label={`תמונות ${product.name}`}>
        <div className="business-product-detail__thumbs">
          {gallery.map((image, index) => <button key={image} type="button" className={index === activeImage ? 'is-active' : undefined} onClick={() => setActiveImage(index)} aria-label={`הצגת תמונה ${index + 1} של ${product.name}`}><img src={image} alt="" loading="lazy" decoding="async" /></button>)}
        </div>
        <div className="business-product-detail__image">
          {gallery[activeImage] ? <img src={gallery[activeImage]} alt={product.imageAlt ?? product.name} /> : <span>HTC</span>}
          <span className={available ? 'business-product-detail__stock' : 'business-product-detail__stock business-product-detail__stock--empty'}>{available ? 'במלאי לעסקים' : 'לא זמין כרגע'}</span>
        </div>
      </div>
      <div className="business-product-detail__info">
        <p className="kicker">HTC PRO · הזמנה עסקית</p>
        <h1>{product.name}</h1>
        <p className="business-product-detail__subtitle">{content.subtitle}</p>
        <div className="business-product-detail__identity"><span>דגם / מק״ט: {product.sku ?? product.handle.toUpperCase()}</span><span>מוצר מקורי · יבואן רשמי</span></div>
        <p className="business-product-detail__description">{content.description}</p>
        {!pricedProduct ? <div className="business-product-detail__price-gate"><b>מחיר עסקי לאחר אישור</b><span>היכנסו לחשבון העסקי המאושר כדי להציג מחיר ותנאי הזמנה.</span></div> : <div className="business-product-detail__price"><span>מחיר לעסק, לפני מע״מ</span><strong>{formatPrice(pricedProduct.netUnitPrice)}</strong><small>כולל מע״מ ({Math.round(pricedProduct.vatRate * 100)}%): {formatPrice(pricedProduct.grossUnitPrice)}</small></div>}
        <p className="business-product-detail__terms">מינימום {minimum} יח׳ · בקפיצות של {Math.max(1, product.quantityIncrement)} יח׳</p>
        <div className="business-product-detail__actions"><div className="business-quantity" aria-label={`כמות ${product.name}`}><button type="button" aria-label="הפחתת כמות" onClick={() => changeQuantity(-1)} disabled={quantity <= minimum}>−</button><output>{quantity}</output><button type="button" aria-label="הגדלת כמות" onClick={() => changeQuantity(1)} disabled={quantity >= maximum}>+</button></div>{hasPrice && <button className="button button--gold" type="button" disabled={!available} onClick={() => { cart.addLine({ productId: product.productId, quantity }); setFeedback('נוסף לסל העסקי') }}>{available ? 'הוספה להזמנה' : 'לא זמין'}</button>}</div>
        {feedback && <p className="business-product-detail__feedback" role="status"><span>{feedback}</span><Link href="/business/cart">לסל ולתשלום</Link></p>}
        {manual && <a className="business-product-detail__manual" href={manual.href} download>הוראות הפעלה (PDF)</a>}
      </div>
    </article>
    <section className="business-product-detail__specs" aria-labelledby="businessSpecsTitle"><div><p className="kicker">מפרט לעסק</p><h2 id="businessSpecsTitle">כל מה שצריך<br />לפני שמזמינים.</h2><p>מפרט ברור לצוות, למדף ולמכירה ללקוח הסופי.</p></div><dl>{content.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="business-product-detail__support" aria-label="מידע נוסף"><details open><summary>מה מגיע באריזה?<span>+</span></summary><p>{content.boxContents}</p></details><details><summary>טעינה, עבודה ותחזוקה<span>+</span></summary><p>{content.powerInfo}</p></details><details><summary>אחריות ושירות<span>+</span></summary><p>12 חודשי אחריות יבואן רשמי על פגמי ייצור, בכפוף לתנאי האחריות. השירות ניתן בישראל.</p></details></section>
  </section>
}
