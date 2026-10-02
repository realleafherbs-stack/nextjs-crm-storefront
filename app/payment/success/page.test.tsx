import { describe, expect, it, vi } from 'vitest'

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`)
  }),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: vi.fn() })) }))
vi.mock('../../components/Navbar', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('./SuccessClient', () => ({ default: () => null }))

import PaymentSuccessPage from './page'

describe('PaymentSuccessPage', () => {
  it('routes a direct HYP return through secure verification before showing success', async () => {
    await expect(PaymentSuccessPage({
      searchParams: Promise.resolve({
        Id: '492082312', CCode: '0', Amount: '158.00', ACode: '16071408',
        Order: 'HT-492082312-abc12345', Sign: 'hyp-signature',
      }),
    } as never)).rejects.toThrow('REDIRECT:/api/hyp-return?Id=492082312&CCode=0&Amount=158.00&ACode=16071408&Order=HT-492082312-abc12345&Sign=hyp-signature')
  })
})
