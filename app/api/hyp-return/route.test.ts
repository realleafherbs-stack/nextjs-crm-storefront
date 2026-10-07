import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getBusinessPaymentIntent: vi.fn(),
  finalizeBusinessOrder: vi.fn(),
  verifyHypReturn: vi.fn(),
  sendMetaCapiEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../lib/business-crm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/business-crm')>()),
  businessCrm: { getBusinessPaymentIntent: mocks.getBusinessPaymentIntent, finalizeBusinessOrder: mocks.finalizeBusinessOrder },
}))
vi.mock('../../../lib/hyp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/hyp')>()),
  verifyHypReturn: mocks.verifyHypReturn,
}))
vi.mock('../../../lib/metaCapi', () => ({ sendMetaCapiEvent: mocks.sendMetaCapiEvent }))
vi.mock('../../../lib/orders', () => ({ finalizeOrder: vi.fn(), getStagedCheckoutIntent: vi.fn() }))

import { GET } from './route'

const orderId = 'HTB-1790000000000-abcdef12'
const verified = { orderId, amount: 348, transactionId: 'tx-1', approvalCode: 'ap-1' }
const ret = () => GET(new NextRequest(`https://www.htcpro.co.il/api/hyp-return?Order=${orderId}&Amount=348.00&CCode=0&Sign=s`, {
  headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1', 'user-agent': 'UA/1' },
}))

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockClear())
  mocks.getBusinessPaymentIntent.mockResolvedValue({ orderId, amount: 348 })
  mocks.verifyHypReturn.mockResolvedValue(verified)
})

describe('HYP return for a business order', () => {
  it('sends one server Purchase after the payment is verified and the order is marked paid', async () => {
    mocks.finalizeBusinessOrder.mockResolvedValue({
      ok: true,
      already: false,
      order: { total: 348, productIds: ['p1', 'p2'], customerEmail: 'buyer@example.com', customerPhone: '0500000000' },
    })

    const response = await ret()

    expect(response.headers.get('location')).toBe('https://www.htcpro.co.il/business/account?payment=success')
    expect(mocks.sendMetaCapiEvent).toHaveBeenCalledTimes(1)
    expect(mocks.sendMetaCapiEvent).toHaveBeenCalledWith({
      event: 'Purchase',
      value: 348,
      orderId,
      contentIds: ['p1', 'p2'],
      email: 'buyer@example.com',
      phone: '0500000000',
      clientIp: '1.2.3.4',
      userAgent: 'UA/1',
    })
  })

  it('sends nothing for a repeated return of an order that was already paid', async () => {
    mocks.finalizeBusinessOrder.mockResolvedValue({ ok: true, already: true })

    await ret()

    expect(mocks.sendMetaCapiEvent).not.toHaveBeenCalled()
  })

  it('sends nothing when the payment cannot be verified', async () => {
    mocks.verifyHypReturn.mockRejectedValue(new Error('not paid'))

    const response = await ret()

    expect(response.headers.get('location')).toContain('/payment/failure')
    expect(mocks.finalizeBusinessOrder).not.toHaveBeenCalled()
    expect(mocks.sendMetaCapiEvent).not.toHaveBeenCalled()
  })
})
