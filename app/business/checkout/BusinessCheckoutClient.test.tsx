// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BusinessCheckoutClient } from './BusinessCheckoutClient'

it('has no B2B coupon input and keeps the order summary above delivery fields on mobile', () => {
  render(<BusinessCheckoutClient initialLines={[{ productId: 'p1', quantity: 2 }]} initialCatalog={[{
    productId: 'p1', handle: 'one-pro', name: 'HTC One Pro', image: null, imageAlt: null, sku: 'AT-799', stock: 10,
    minQuantity: 1, quantityIncrement: 1, maxQuantity: null, netUnitPrice: 100, vatRate: 0.18, grossUnitPrice: 118,
  }]} />)

  expect(screen.queryByLabelText(/קופון/)).toBeNull()
  expect(screen.getByText('פירוט הזמנה').compareDocumentPosition(screen.getByLabelText('עיר')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
