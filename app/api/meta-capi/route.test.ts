import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { sendMetaCapiEvent } = vi.hoisted(() => ({ sendMetaCapiEvent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../../../lib/metaCapi', () => ({ sendMetaCapiEvent }))

import { POST } from './route'

const call = (body: unknown, cookie = '') => POST(new NextRequest('https://www.htcpro.co.il/api/meta-capi', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'user-agent': 'UA/1', 'x-forwarded-for': '1.2.3.4', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
}))

beforeEach(() => sendMetaCapiEvent.mockClear())

describe('POST /api/meta-capi', () => {
  it.each(['AddToCart', 'InitiateCheckout', 'AddPaymentInfo'])('forwards %s with the shared event id and browser ids', async (event) => {
    const res = await call({ event, eventId: 'evt-1', value: 138, contentIds: ['p1'], email: 'a@b.co', phone: '0500000000' }, '_fbp=fb.1.1.2; _fbc=fb.1.3.x')

    expect(res.status).toBe(200)
    expect(sendMetaCapiEvent).toHaveBeenCalledWith(expect.objectContaining({
      event, eventId: 'evt-1', value: 138, contentIds: ['p1'], email: 'a@b.co', phone: '0500000000',
      fbp: 'fb.1.1.2', fbc: 'fb.1.3.x', clientIp: '1.2.3.4', userAgent: 'UA/1',
    }))
  })

  it('rejects unknown events and malformed ids', async () => {
    expect((await call({ event: 'Lead', value: 1 })).status).toBe(400)
    expect((await call({ event: 'AddToCart', value: 1, eventId: 123 })).status).toBe(400)
    expect(sendMetaCapiEvent).not.toHaveBeenCalled()
  })
})
