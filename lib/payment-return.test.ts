import { describe, expect, it } from 'vitest'
import { paymentReturnFailurePath } from './payment-return'

describe('paymentReturnFailurePath', () => {
  it('keeps an approved-order reference while exposing only a safe failure category', () => {
    expect(paymentReturnFailurePath({
      orderId: 'HT-1790936451253-a2f3d32f',
      reason: 'HYP_UNAVAILABLE',
    })).toBe('/payment/failure?Order=HT-1790936451253-a2f3d32f&reason=HYP_UNAVAILABLE')
  })

  it('does not add empty diagnostic values to the public URL', () => {
    expect(paymentReturnFailurePath({ orderId: null, reason: null })).toBe('/payment/failure')
  })
})
