// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  addBusinessLine,
  BUSINESS_CART_STORAGE_KEY,
  readBusinessCart,
  reconcileBusinessCart,
} from './business-cart'

describe('business cart storage', () => {
  beforeEach(() => localStorage.clear())

  it('keeps business cart data separate from the retail storage key', () => {
    addBusinessLine({ productId: 'p1', quantity: 2 })

    expect(localStorage.getItem('htc-israel-cart-v2')).toBeNull()
    expect(JSON.parse(localStorage.getItem(BUSINESS_CART_STORAGE_KEY) ?? '[]')).toEqual([{ productId: 'p1', quantity: 2 }])
  })

  it('drops stale or unavailable products instead of keeping old price data', () => {
    const result = reconcileBusinessCart(
      [{ productId: 'available', quantity: 1 }, { productId: 'gone', quantity: 3 }, { productId: 'sold-out', quantity: 2 }],
      [{ productId: 'available', stock: 4, minQuantity: 2, quantityIncrement: 2, maxQuantity: null }, { productId: 'sold-out', stock: 0, minQuantity: 1, quantityIncrement: 1, maxQuantity: null }],
    )

    expect(result.lines).toEqual([{ productId: 'available', quantity: 2 }])
    expect(result.removedProductIds).toEqual(['gone', 'sold-out'])
  })

  it('only reads product ids and quantities from browser storage', () => {
    localStorage.setItem(BUSINESS_CART_STORAGE_KEY, JSON.stringify([{ productId: 'p1', quantity: 2, netUnitPrice: 1 }, { productId: '', quantity: 5 }]))

    expect(readBusinessCart()).toEqual([{ productId: 'p1', quantity: 2 }])
  })
})
