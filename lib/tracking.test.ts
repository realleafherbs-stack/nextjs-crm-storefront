// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sendGTMEvent } = vi.hoisted(() => ({ sendGTMEvent: vi.fn() }))
vi.mock('@next/third-parties/google', () => ({ sendGTMEvent }))

import { trackFunnelEvent } from './tracking'

beforeEach(() => {
  sendGTMEvent.mockClear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
})
afterEach(() => vi.unstubAllGlobals())

describe('trackFunnelEvent', () => {
  it('uses one event id for the dataLayer push and the server call', () => {
    const id = trackFunnelEvent({
      ga4Event: 'begin_checkout',
      metaEvent: 'InitiateCheckout',
      value: 138,
      items: [{ id: 'p1', name: 'HTC Trio', price: 138, quantity: 1 }],
    })

    expect(sendGTMEvent).toHaveBeenNthCalledWith(1, { ecommerce: null })
    expect(sendGTMEvent).toHaveBeenNthCalledWith(2, {
      event: 'begin_checkout',
      event_id: id,
      ecommerce: { currency: 'ILS', value: 138, items: [{ item_id: 'p1', item_name: 'HTC Trio', price: 138, quantity: 1 }] },
    })
    const sent = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(sent).toEqual({ event: 'InitiateCheckout', eventId: id, value: 138, contentIds: ['p1'] })
    expect(vi.mocked(fetch).mock.calls[0][1]?.keepalive).toBe(true)
  })

  it('creates a new id for every action and only sends contact details when given', () => {
    const base = { ga4Event: 'add_payment_info', metaEvent: 'AddPaymentInfo', value: 1, items: [] } as const
    const a = trackFunnelEvent({ ...base, contact: { email: 'a@b.co', phone: '0500000000' } })
    const b = trackFunnelEvent(base)

    expect(a).not.toBe(b)
    const [withContact, without] = vi.mocked(fetch).mock.calls.map((c) => JSON.parse(c[1]?.body as string))
    expect(withContact).toMatchObject({ email: 'a@b.co', phone: '0500000000' })
    expect(without).not.toHaveProperty('email')
  })
})
