import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { stageCheckoutIntent } = vi.hoisted(() => ({ stageCheckoutIntent: vi.fn().mockResolvedValue(true) }))
vi.mock('../../../lib/orders', () => ({ stageCheckoutIntent }))
vi.mock('../../../lib/products', () => ({
  getProducts: async () => [{ id: 'p1', name: 'HTC Trio', price: 138, stock: 10, gtin: '6971864100592' }],
}))

import { POST } from './route'

const customer = { firstName: 'A', lastName: 'B', email: 'a@b.co', phone: '0500000000', street: 's', houseNumber: '1', apartment: '2', address: 's 1', city: 'c' }
const call = (extra: Record<string, unknown> = {}) => POST(new NextRequest('https://www.htcpro.co.il/api/hyp-checkout', {
  method: 'POST',
  body: JSON.stringify({ customer, items: [{ id: 'p1', qty: 1 }], ...extra }),
}))

beforeEach(() => {
  stageCheckoutIntent.mockClear()
  vi.stubEnv('HYP_MASOF', 'm'); vi.stubEnv('HYP_KEY', 'k'); vi.stubEnv('HYP_PASSP', 'p')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('action=pay&Sign=x')))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('POST /api/hyp-checkout campaign attribution', () => {
  it('stages only the allowlisted campaign parameters with the order', async () => {
    const res = await call({ attribution: { utm_source: 'facebook', utm_campaign: 'oct', fbclid: 'abc', evil: 'x', utm_medium: 7 } })

    expect(res.status).toBe(200)
    expect(stageCheckoutIntent.mock.calls[0][1].attribution).toEqual({ utm_source: 'facebook', utm_campaign: 'oct', fbclid: 'abc' })
  })

  it('stages no attribution when the visitor came without a campaign', async () => {
    await call()
    expect(stageCheckoutIntent.mock.calls[0][1]).not.toHaveProperty('attribution')
  })
})
