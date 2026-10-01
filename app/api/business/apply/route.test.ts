import { NextRequest } from 'next/server'
import { beforeEach, expect, it, vi } from 'vitest'

const { apply } = vi.hoisted(() => ({ apply: vi.fn() }))

vi.mock('../../../../lib/business-crm', () => ({ businessCrm: { apply } }))
vi.mock('../_shared', () => ({ businessRouteError: vi.fn() }))

import { POST } from './route'

beforeEach(() => {
  apply.mockReset()
  apply.mockResolvedValue({ applicationId: 'application-123' })
})

it('rejects a business-account application without a VAT or company number', async () => {
  const response = await POST(new NextRequest('https://www.htcpro.co.il/api/business/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'מספרת הדוגמה',
      contactName: 'דנה כהן',
      email: 'owner@example.com',
      phone: '0500000000',
      city: 'חולון',
      businessType: 'BARBER',
    }),
  }))

  expect(response.status).toBe(400)
  expect(apply).not.toHaveBeenCalled()
})
