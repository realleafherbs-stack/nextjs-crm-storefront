// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { BusinessCheckoutClient } from './BusinessCheckoutClient'

afterEach(() => cleanup())

it('has no B2B coupon input and keeps the order summary above delivery fields on mobile', () => {
  render(<BusinessCheckoutClient initialLines={[{ productId: 'p1', quantity: 2 }]} initialCatalog={[{
    productId: 'p1', handle: 'one-pro', name: 'HTC One Pro', image: null, imageAlt: null, sku: 'AT-799', stock: 10,
    minQuantity: 1, quantityIncrement: 1, maxQuantity: null, netUnitPrice: 100, vatRate: 0.18, grossUnitPrice: 118,
  }]} />)

  expect(screen.queryByLabelText(/קופון/)).toBeNull()
  expect(screen.getByText('פירוט הזמנה').compareDocumentPosition(screen.getByRole('textbox', { name: /עיר/ })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByRole('button', { name: 'לתשלום בכרטיס אשראי' })).toBeTruthy()
})

it('clearly identifies and focuses the first missing delivery field before payment', async () => {
  const user = userEvent.setup()
  render(<BusinessCheckoutClient initialLines={[{ productId: 'p1', quantity: 2 }]} initialCatalog={[{
    productId: 'p1', handle: 'one-pro', name: 'HTC One Pro', image: null, imageAlt: null, sku: 'AT-799', stock: 10,
    minQuantity: 1, quantityIncrement: 1, maxQuantity: null, netUnitPrice: 100, vatRate: 0.18, grossUnitPrice: 118,
  }]} />)

  await user.click(screen.getByRole('button', { name: 'לתשלום בכרטיס אשראי' }))

  const firstName = screen.getByRole('textbox', { name: /שם מלא/ })
  expect(screen.getByRole('alert').textContent).toContain('יש למלא את השדות המסומנים')
  expect(firstName.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(firstName)
})
