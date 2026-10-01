// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import BusinessProductCard from './BusinessProductCard'

const product = {
  productId: 'at-799', handle: 'at-799', name: 'HTC One Pro', image: null, imageAlt: null, sku: 'AT-799', stock: 12,
  minQuantity: 1, quantityIncrement: 1, maxQuantity: null, netUnitPrice: 150, vatRate: 0.18, grossUnitPrice: 177,
}

afterEach(cleanup)

it('confirms a business-cart addition with a direct checkout-cart link', () => {
  const onAdd = vi.fn()
  render(<BusinessProductCard product={product} onAdd={onAdd} />)

  fireEvent.click(screen.getByRole('button', { name: 'הוספה להזמנה' }))

  expect(onAdd).toHaveBeenCalledWith({ productId: 'at-799', quantity: 1 })
  expect(screen.getByRole('link', { name: 'לסל ולתשלום' }).getAttribute('href')).toBe('/business/cart')
})

it('gives a business customer the matching product manual to download', () => {
  render(<BusinessProductCard product={product} onAdd={vi.fn()} />)

  expect(screen.getByRole('link', { name: 'לפרטים ומפרט' }).getAttribute('href')).toBe('/business/catalog/at-799')
  const manual = screen.getByRole('link', { name: 'הוראות הפעלה (PDF)' })
  expect(manual.getAttribute('href')).toBe('/manuals/htc-at-799-he.pdf')
  expect(manual.hasAttribute('download')).toBe(true)
})
