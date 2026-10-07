// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../../../lib/business-cart', () => ({ useBusinessCart: () => ({ replaceLines: vi.fn() }) }))

import BusinessOrdersClient from './BusinessOrdersClient'

type DataLayerWindow = Window & { dataLayer?: unknown[] }

const order = {
  id: 'HTB-1790000000000-abcdef12',
  status: 'PAID',
  netSubtotal: 300,
  vatAmount: 54,
  grossTotal: 354,
  createdAt: '2026-10-07T10:00:00.000Z',
  paidAt: '2026-10-07T10:01:00.000Z',
  items: [{ productId: 'p1', productName: 'HTC Trio', sku: '6971864100592', quantity: 3, netUnitPrice: 100, grossUnitPrice: 118, lineGrossTotal: 354 }],
}

beforeEach(() => {
  ;(window as DataLayerWindow).dataLayer = []
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('business account after payment', () => {
  it('pushes the business purchase once, with the order lines, after the order list loads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ orders: [order] }), { status: 200 })))
    render(<BusinessOrdersClient paymentConfirmed confirmedOrder={{ orderId: order.id, amount: 354 }} />)

    expect((window as DataLayerWindow).dataLayer).toEqual([])
    await waitFor(() => expect((window as DataLayerWindow).dataLayer).toHaveLength(2))

    expect((window as DataLayerWindow).dataLayer?.[1]).toEqual({
      event: 'purchase',
      customer_type: 'business',
      ecommerce: {
        transaction_id: order.id,
        currency: 'ILS',
        value: 354,
        items: [{ item_id: 'p1', item_name: 'HTC Trio', price: 118, quantity: 3 }],
      },
    })
  })

  it('pushes nothing on a normal visit to the account page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ orders: [order] }), { status: 200 })))
    render(<BusinessOrdersClient />)

    await screen.findByText('HTC Trio', { exact: false }).catch(() => undefined)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    expect((window as DataLayerWindow).dataLayer).toEqual([])
  })
})
