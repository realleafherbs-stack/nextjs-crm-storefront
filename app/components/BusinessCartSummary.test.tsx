// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BUSINESS_CART_STORAGE_KEY } from '../../lib/business-cart'
import BusinessCartSummary from './BusinessCartSummary'

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}))

const product = {
  productId: 'at-799',
  handle: 'at-799',
  name: 'HTC One Pro',
  image: 'https://www.ducks.co.il/media/at-799.jpg',
  imageAlt: 'HTC One Pro עם מסך LCD',
  sku: 'AT-799',
  stock: 12,
  minQuantity: 1,
  quantityIncrement: 1,
  maxQuantity: null,
  netUnitPrice: 150,
  vatRate: 0.18,
  grossUnitPrice: 177,
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(BUSINESS_CART_STORAGE_KEY, JSON.stringify([{ productId: product.productId, quantity: 1 }]))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [product] }) }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('labels the cart thumbnail and removes its matching product through a named trash control', async () => {
  render(<BusinessCartSummary />)

  await screen.findByRole('heading', { name: product.name })
  expect(screen.getByRole('img', { name: product.imageAlt })).not.toBeNull()

  fireEvent.click(screen.getByRole('button', { name: `הסרת ${product.name} מהסל` }))

  await waitFor(() => expect(screen.queryByRole('heading', { name: product.name })).toBeNull())
})
