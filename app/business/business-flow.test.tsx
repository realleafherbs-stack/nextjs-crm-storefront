import { expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import robots from '../robots'
import sitemap from '../sitemap'

vi.mock('../api/business/_shared', () => ({
  businessPrivateHeaders: {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  },
  requireCurrentBusinessSession: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  businessRouteError: () => new Response(JSON.stringify({ error: 'נדרשת התחברות לחשבון עסקי' }), {
    status: 401,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/json',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  }),
}))

import { POST as requestBusinessCheckoutAsGuest } from '../api/business/checkout/route'

it('keeps protected business pages out of public indexing and rejects a guest checkout', async () => {
  const rules = robots().rules as Array<{ userAgent: string; disallow?: string[] | string }>
  const generalRule = rules.find((rule) => rule.userAgent === '*')
  const disallow = Array.isArray(generalRule?.disallow) ? generalRule.disallow : [generalRule?.disallow]
  expect(disallow).toContain('/business/account')
  expect(disallow).toContain('/business/checkout')

  const entries = await sitemap()
  const urls = entries.map((entry) => entry.url)
  expect(urls).toContain('https://www.htcpro.co.il/business')
  expect(urls).not.toContain('https://www.htcpro.co.il/business/account')

  const response = await requestBusinessCheckoutAsGuest(new NextRequest('https://www.htcpro.co.il/api/business/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: [{ productId: 'p1', quantity: 1 }], delivery: { name: 'Guest', email: 'guest@example.com', phone: '0500000000', street: 'הרצל', houseNumber: '1', city: 'חולון' } }),
  }))
  expect(response.status).toBe(401)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
})
