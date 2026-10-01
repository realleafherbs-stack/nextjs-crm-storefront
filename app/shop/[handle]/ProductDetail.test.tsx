// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { productContent } from '../../../lib/product-content'
import { products } from '../../../lib/products-data'
import ProductDetail from './ProductDetail'

vi.mock('@next/third-parties/google', () => ({ sendGTMEvent: vi.fn() }))
vi.mock('../../context/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), openPanel: vi.fn() }) }))

it('gives a retail customer the matching product manual to download', () => {
  const product = products[0]
  render(<ProductDetail product={product} content={productContent[product.gtin]} related={[]} />)

  const manual = screen.getByRole('link', { name: 'הוראות הפעלה (PDF)' })
  expect(manual.getAttribute('href')).toBe('/manuals/htc-at-799-he.pdf')
  expect(manual.hasAttribute('download')).toBe(true)
})
