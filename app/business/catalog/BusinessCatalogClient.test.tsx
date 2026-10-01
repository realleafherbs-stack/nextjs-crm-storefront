// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import BusinessCatalogClient from './BusinessCatalogClient'

const guestCatalog = [{
  productId: 'at-735',
  handle: 'at-735',
  name: 'HTC One Plus',
  image: '/at-735.jpg',
  imageAlt: 'HTC One Plus',
  sku: 'AT-735',
  stock: 4,
  minQuantity: 1,
  quantityIncrement: 1,
  maxQuantity: null,
}]

it('shows a guest price gate instead of a wholesale price', () => {
  render(<BusinessCatalogClient catalog={guestCatalog} />)

  expect(screen.getByText('מחיר עסקי לאחר אישור')).not.toBeNull()
  expect(screen.queryByText(/₪/)).toBeNull()
})
