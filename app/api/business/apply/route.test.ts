import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { apply, sendMetaCapiEvent } = vi.hoisted(() => ({
  apply: vi.fn(),
  sendMetaCapiEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../lib/business-crm', () => ({ businessCrm: { apply } }))
vi.mock('../../../../lib/metaCapi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../lib/metaCapi')>()),
  sendMetaCapiEvent,
}))
vi.mock('../_shared', () => ({
  businessRouteError: () => new Response(JSON.stringify({ error: 'failed' }), { status: 502 }),
}))

import { POST } from './route'

const validBody = {
  businessName: 'מספרת הדוגמה',
  contactName: 'דנה כהן',
  email: 'owner@example.com',
  phone: '0500000000',
  city: 'תל אביב',
  businessType: 'BARBER',
  businessIdentifier: '515253763',
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://www.htcpro.co.il/api/business/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  apply.mockReset().mockResolvedValue({ ok: true, applicationId: 'app_123' })
  sendMetaCapiEvent.mockClear()
})

describe('POST /api/business/apply', () => {
  it('rejects a business-account application without a VAT or company number', async () => {
    const { businessIdentifier: _omitted, ...withoutIdentifier } = validBody
    const response = await POST(request(withoutIdentifier))

    expect(response.status).toBe(400)
    expect(apply).not.toHaveBeenCalled()
    expect(sendMetaCapiEvent).not.toHaveBeenCalled()
  })

  it('stores campaign parameters with the application and ignores unknown keys', async () => {
    const response = await POST(request({
      ...validBody,
      attribution: { utm_source: 'facebook', utm_term: 'barber', fbclid: 'abc', evil: 'x', utm_medium: 42 },
    }))

    expect(await response.json()).toEqual({ ok: true, applicationId: 'app_123' })
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({
      attribution: { utm_source: 'facebook', utm_term: 'barber', fbclid: 'abc' },
    }))
  })

  it('sends CompleteRegistration to Meta with the application id as event id', async () => {
    await POST(request(
      { ...validBody, attribution: { fbclid: 'abc' } },
      { cookie: '_fbp=fb.1.111.222; _fbc=fb.1.333.xyz', 'x-forwarded-for': '1.2.3.4, 10.0.0.1', 'user-agent': 'UA/1', referer: 'https://www.htcpro.co.il/business/apply' },
    ))

    expect(sendMetaCapiEvent).toHaveBeenCalledTimes(1)
    expect(sendMetaCapiEvent).toHaveBeenCalledWith({
      event: 'CompleteRegistration',
      eventId: 'app_123',
      email: 'owner@example.com',
      phone: '0500000000',
      fbp: 'fb.1.111.222',
      fbc: 'fb.1.333.xyz',
      clientIp: '1.2.3.4',
      userAgent: 'UA/1',
      eventSourceUrl: 'https://www.htcpro.co.il/business/apply',
    })
  })

  it('builds fbc from fbclid when the _fbc cookie is missing', async () => {
    await POST(request({ ...validBody, attribution: { fbclid: 'abc' } }))
    expect(sendMetaCapiEvent.mock.calls[0][0].fbc).toMatch(/^fb\.1\.\d+\.abc$/)
  })

  it('sends nothing to Meta when the CRM did not save the application', async () => {
    apply.mockRejectedValue(new Error('down'))
    const response = await POST(request(validBody))

    expect(response.status).toBe(502)
    expect(sendMetaCapiEvent).not.toHaveBeenCalled()
  })

  it('sends nothing to Meta for an invalid application', async () => {
    const response = await POST(request({ ...validBody, email: '' }))

    expect(response.status).toBe(400)
    expect(apply).not.toHaveBeenCalled()
    expect(sendMetaCapiEvent).not.toHaveBeenCalled()
  })
})
