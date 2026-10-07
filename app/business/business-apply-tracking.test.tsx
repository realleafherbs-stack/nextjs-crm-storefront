// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

import BusinessLandingClient, { BusinessApplicationForm } from './BusinessLandingClient'

type DataLayerWindow = Window & { dataLayer?: unknown[] }

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('שם העסק'), 'מספרת הדוגמה')
  await user.type(screen.getByLabelText('שם מלא'), 'דנה כהן')
  await user.type(screen.getByLabelText('אימייל עסקי'), 'owner@example.com')
  await user.type(screen.getByLabelText('טלפון'), '0500000000')
  await user.selectOptions(screen.getByLabelText('סוג העסק'), 'BARBER')
  await user.type(screen.getByLabelText('עיר'), 'תל אביב')
  await user.type(screen.getByLabelText(/ע\.מ\. \/ ח\.פ\./), '515253763')
  await user.click(screen.getByRole('button', { name: 'שליחת בקשה' }))
}

beforeEach(() => {
  replace.mockReset()
  ;(window as DataLayerWindow).dataLayer = []
  window.sessionStorage.clear()
  window.history.replaceState({}, '', '/business/apply')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('business application tracking', () => {
  it('pushes one PII-free event only after the CRM saved the application', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, applicationId: 'app_123' }), { status: 200 })))
    // The push must already be in the dataLayer by the time the page moves on to
    // the confirmation screen, so GTM sees it before the navigation.
    let dataLayerAtRedirect: unknown[] = []
    replace.mockImplementation(() => { dataLayerAtRedirect = [...((window as DataLayerWindow).dataLayer ?? [])] })
    render(<BusinessApplicationForm />)

    expect((window as DataLayerWindow).dataLayer).toEqual([])
    await fillAndSubmit(user)
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/business/application-received'))

    const expected = [{ event: 'business_apply_success', lead_id: 'app_123', business_type: 'BARBER' }]
    expect(dataLayerAtRedirect).toEqual(expected)
    expect((window as DataLayerWindow).dataLayer).toEqual(expected)
  })

  it('pushes nothing when the application is rejected', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'נכשל' }), { status: 502 })))
    render(<BusinessApplicationForm />)

    await fillAndSubmit(user)
    await screen.findByRole('alert')

    expect((window as DataLayerWindow).dataLayer).toEqual([])
    expect(replace).not.toHaveBeenCalled()
  })

  it('carries the campaign parameters from the landing page into the application', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/business?utm_source=facebook&utm_campaign=b2b&fbclid=abc123')
    render(<BusinessLandingClient />)
    cleanup()

    window.history.replaceState({}, '', '/business/apply')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, applicationId: 'app_1' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<BusinessApplicationForm />)
    await fillAndSubmit(user)
    await waitFor(() => expect(replace).toHaveBeenCalled())

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sent.attribution).toEqual({ utm_source: 'facebook', utm_campaign: 'b2b', fbclid: 'abc123' })
  })
})
