// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { trackBusinessPurchase } from './business-analytics'

type DataLayerWindow = Window & { dataLayer?: unknown[] }

const items = [
  { productId: 'p1', productName: 'HTC Trio', grossUnitPrice: 94.4, quantity: 5 },
  { productId: 'p2', productName: 'HTC Start', grossUnitPrice: 82.6, quantity: 2 },
]

beforeEach(() => {
  ;(window as DataLayerWindow).dataLayer = []
  window.localStorage.clear()
})

describe('trackBusinessPurchase', () => {
  it('pushes a reset then a purchase marked as a business customer, with no personal data', () => {
    trackBusinessPurchase({ orderId: 'HTB-1', amount: 637.2, items })

    expect((window as DataLayerWindow).dataLayer).toEqual([
      { ecommerce: null },
      {
        event: 'purchase',
        customer_type: 'business',
        ecommerce: {
          transaction_id: 'HTB-1',
          currency: 'ILS',
          value: 637.2,
          items: [
            { item_id: 'p1', item_name: 'HTC Trio', price: 94.4, quantity: 5 },
            { item_id: 'p2', item_name: 'HTC Start', price: 82.6, quantity: 2 },
          ],
        },
      },
    ])
  })

  it('pushes each order only once, even if the page is reloaded', () => {
    trackBusinessPurchase({ orderId: 'HTB-1', amount: 100, items })
    trackBusinessPurchase({ orderId: 'HTB-1', amount: 100, items })

    expect((window as DataLayerWindow).dataLayer).toHaveLength(2)

    trackBusinessPurchase({ orderId: 'HTB-2', amount: 50, items })
    expect((window as DataLayerWindow).dataLayer).toHaveLength(4)
  })

  it('still reports the sale when the order lines are not available', () => {
    trackBusinessPurchase({ orderId: 'HTB-3', amount: 200, items: [] })

    const purchase = (window as DataLayerWindow).dataLayer?.[1] as { ecommerce: { value: number; items: unknown[] } }
    expect(purchase.ecommerce.value).toBe(200)
    expect(purchase.ecommerce.items).toEqual([])
  })
})
