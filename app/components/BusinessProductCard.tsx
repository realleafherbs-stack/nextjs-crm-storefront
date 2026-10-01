'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { BusinessCatalogItem } from '../../lib/business-crm'
import { getProductManual } from '../../lib/product-manuals'

export type BusinessCatalogViewItem = Omit<BusinessCatalogItem, 'netUnitPrice' | 'vatRate' | 'grossUnitPrice'> & Partial<Pick<BusinessCatalogItem, 'netUnitPrice' | 'vatRate' | 'grossUnitPrice'>>

function formatPrice(value: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2 }).format(value)
}

function effectiveMaximum(product: BusinessCatalogViewItem) {
  const stockCap = product.stock === null ? Number.POSITIVE_INFINITY : Math.max(0, product.stock)
  const termCap = product.maxQuantity === null ? Number.POSITIVE_INFINITY : Math.max(0, product.maxQuantity)
  return Math.min(stockCap, termCap)
}

function isWholesalerPriceVisible(product: BusinessCatalogViewItem): product is BusinessCatalogItem {
  return typeof product.netUnitPrice === 'number' && typeof product.vatRate === 'number' && typeof product.grossUnitPrice === 'number'
}

function validNextQuantity(quantity: number, direction: 1 | -1, product: BusinessCatalogViewItem) {
  const min = Math.max(1, product.minQuantity)
  const increment = Math.max(1, product.quantityIncrement)
  const max = effectiveMaximum(product)
  return Math.max(min, Math.min(max, quantity + direction * increment))
}

export default function BusinessProductCard({ product, onAdd }: { product: BusinessCatalogViewItem; onAdd: (line: { productId: string; quantity: number }) => void }) {
  const minimum = Math.max(1, product.minQuantity)
  const maximum = effectiveMaximum(product)
  const available = maximum >= minimum
  const [quantity, setQuantity] = useState(minimum)
  const [feedback, setFeedback] = useState<string | null>(null)
  const hasPrice = isWholesalerPriceVisible(product)
  const manual = getProductManual(product.handle)

  function changeQuantity(direction: 1 | -1) {
    setQuantity((current) => validNextQuantity(current, direction, product))
  }

  return <article className="business-product-card">
    <div className="business-product-card__media">
      {product.image ? <img src={product.image} alt={product.imageAlt ?? product.name} loading="lazy" decoding="async" /> : <span>HTC</span>}
      <span className={available ? 'business-product-card__stock' : 'business-product-card__stock business-product-card__stock--empty'}>{available ? 'במלאי לעסקים' : 'לא זמין כרגע'}</span>
    </div>
    <div className="business-product-card__body">
      <div><small>{product.sku ?? product.handle.toUpperCase()}</small><h2>{product.name}</h2></div>
      {!hasPrice ? <div className="business-product-card__gate"><b>מחיר עסקי לאחר אישור</b><span>לקוחות מאושרים רואים מחירון ותנאי הזמנה.</span></div> : <div className="business-product-card__price"><span>מחיר לעסק, לפני מע״מ</span><strong>{formatPrice(product.netUnitPrice)}</strong><small>כולל מע״מ ({Math.round(product.vatRate * 100)}%): {formatPrice(product.grossUnitPrice)}</small></div>}
      <p className="business-product-card__terms">מינימום {minimum} יח׳ · בקפיצות של {Math.max(1, product.quantityIncrement)} יח׳</p>
      {manual && <a className="business-product-card__manual" href={manual.href} download>הוראות הפעלה (PDF)</a>}
      {hasPrice && <div className="business-product-card__actions">
        <div className="business-quantity" aria-label={`כמות ${product.name}`}><button type="button" aria-label="הפחתת כמות" onClick={() => changeQuantity(-1)} disabled={quantity <= minimum}>−</button><output>{quantity}</output><button type="button" aria-label="הגדלת כמות" onClick={() => changeQuantity(1)} disabled={quantity >= maximum}>+</button></div>
        <button className="button button--gold" type="button" disabled={!available} onClick={() => { onAdd({ productId: product.productId, quantity }); setFeedback('נוסף לסל העסקי') }}>{available ? 'הוספה להזמנה' : 'לא זמין'}</button>
      </div>}
      {feedback && <p className="business-product-card__feedback" role="status"><span>{feedback}</span><Link href="/business/cart">לסל ולתשלום</Link></p>}
    </div>
  </article>
}
