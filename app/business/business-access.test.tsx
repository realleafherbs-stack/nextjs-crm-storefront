// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BusinessLandingClient, { BusinessApplicationForm, requestBusinessReset } from './BusinessLandingClient'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

afterEach(() => { cleanup(); replace.mockReset() })

describe('business access journey', () => {
  it('introduces direct importer purchasing with the HTC product visual', () => {
    render(<BusinessLandingClient />)

    expect(screen.getByRole('heading', { name: 'מחירי יבואן. מוצרים מקצועיים. הזמנה ישירה לעסק.' })).not.toBeNull()
    expect(screen.getByText('פותחים חשבון עסקי ומקבלים גישה למחירים מיוחדים, מלאי זמין והזמנות במקום אחד.')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'פתיחת חשבון עסקי' }).getAttribute('href')).toBe('/business/apply')
    expect(screen.getByRole('img', { name: 'מכונת תספורת מקצועית HTC' }).getAttribute('src')).toContain('at-799-barbershop.jpg')
    expect(screen.getByText('מזמינים לעסק')).not.toBeNull()
  })

  it('takes an approved business-account application to its own confirmation page', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    render(<BusinessApplicationForm />)

    await user.type(screen.getByLabelText('שם העסק'), 'מספרת הדוגמה')
    await user.type(screen.getByLabelText('שם מלא'), 'דנה כהן')
    await user.type(screen.getByLabelText('אימייל עסקי'), 'owner@example.com')
    await user.type(screen.getByLabelText('טלפון'), '0500000000')
    await user.selectOptions(screen.getByLabelText('סוג העסק'), 'BARBER')
    await user.type(screen.getByLabelText('עיר'), 'תל אביב')
    await user.type(screen.getByLabelText(/ע\.מ\. \/ ח\.פ\./), '515253763')
    await user.click(screen.getByRole('button', { name: 'שליחת בקשה' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/business/application-received'))
    vi.unstubAllGlobals()
  })

  it('does not submit an application until a VAT or company number is provided', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<BusinessApplicationForm />)

    await user.type(screen.getByLabelText('שם העסק'), 'מספרת הדוגמה')
    await user.type(screen.getByLabelText('שם מלא'), 'דנה כהן')
    await user.type(screen.getByLabelText('אימייל עסקי'), 'owner@example.com')
    await user.type(screen.getByLabelText('טלפון'), '0500000000')
    await user.selectOptions(screen.getByLabelText('סוג העסק'), 'BARBER')
    await user.type(screen.getByLabelText('עיר'), 'תל אביב')
    await user.click(screen.getByRole('button', { name: 'שליחת בקשה' }))

    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('does not reveal whether an email has a business account during reset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    await expect(requestBusinessReset('unknown@example.com')).resolves.toEqual({ ok: true })
    vi.unstubAllGlobals()
  })
})
