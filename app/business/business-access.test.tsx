// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BusinessApplicationForm, requestBusinessReset } from './BusinessLandingClient'

afterEach(() => cleanup())

describe('business access journey', () => {
  it('submits a valid business application and confirms manual review', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    render(<BusinessApplicationForm />)

    await user.type(screen.getByLabelText('שם העסק'), 'מספרת הדוגמה')
    await user.type(screen.getByLabelText('שם מלא'), 'דנה כהן')
    await user.type(screen.getByLabelText('אימייל עסקי'), 'owner@example.com')
    await user.type(screen.getByLabelText('טלפון'), '0500000000')
    await user.selectOptions(screen.getByLabelText('סוג העסק'), 'BARBER')
    await user.type(screen.getByLabelText('עיר'), 'תל אביב')
    await user.click(screen.getByRole('button', { name: 'שליחת בקשה' }))

    expect(await screen.findByText(/הבקשה התקבלה/)).not.toBeNull()
    vi.unstubAllGlobals()
  })

  it('does not reveal whether an email has a business account during reset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    await expect(requestBusinessReset('unknown@example.com')).resolves.toEqual({ ok: true })
    vi.unstubAllGlobals()
  })
})
