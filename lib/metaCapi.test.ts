import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMetaCapiEvent } from './metaCapi'

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

async function sentEvent() {
  const fetchMock = vi.mocked(fetch)
  const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
  return body.data[0]
}

beforeEach(() => {
  vi.stubEnv('META_CAPI_DATASET_ID', 'dataset1')
  vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'token1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('sendMetaCapiEvent', () => {
  it('sends a CompleteRegistration with hashed contact data, browser ids and no commerce data', async () => {
    await sendMetaCapiEvent({
      event: 'CompleteRegistration',
      eventId: 'app_123',
      email: ' Owner@Example.com ',
      phone: '050-000-0000',
      fbp: 'fb.1.111.222',
      fbc: 'fb.1.333.xyz',
      clientIp: '1.2.3.4',
      userAgent: 'UA/1',
    })

    const event = await sentEvent()
    expect(event.event_name).toBe('CompleteRegistration')
    expect(event.event_id).toBe('app_123')
    expect(event.user_data).toEqual({
      em: [sha256('owner@example.com')],
      ph: [sha256('972500000000')],
      fbp: 'fb.1.111.222',
      fbc: 'fb.1.333.xyz',
      client_ip_address: '1.2.3.4',
      client_user_agent: 'UA/1',
    })
    expect(event.custom_data).toBeUndefined()
  })

  it('keeps the Purchase payload keyed by order id with its commerce data', async () => {
    await sendMetaCapiEvent({ event: 'Purchase', value: 100, orderId: 'order_1', contentIds: ['p1'] })

    const event = await sentEvent()
    expect(event.event_id).toBe('order_1')
    expect(event.custom_data).toMatchObject({ currency: 'ILS', value: 100, order_id: 'order_1', content_ids: ['p1'] })
  })

  it('sends test_event_code at the top level only when one is given', async () => {
    await sendMetaCapiEvent({ event: 'CompleteRegistration', eventId: 'app_1', testEventCode: 'TEST42509' })
    const withCode = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(withCode.test_event_code).toBe('TEST42509')
    expect(withCode.data[0].event_id).toBe('app_1')

    vi.mocked(fetch).mockClear()
    await sendMetaCapiEvent({ event: 'CompleteRegistration', eventId: 'app_2' })
    const withoutCode = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(withoutCode).not.toHaveProperty('test_event_code')
  })

  it('does nothing when Meta credentials are not configured', async () => {
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '')
    await sendMetaCapiEvent({ event: 'CompleteRegistration', eventId: 'app_1' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
