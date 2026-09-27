import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBusinessSession, readBusinessSession, requireBusinessSession } from './business-session'

const subject = {
  siteId: 'site-1',
  memberId: 'member-1',
  businessId: 'business-1',
  sessionVersion: 3,
}

describe('business session signatures', () => {
  beforeEach(() => {
    process.env.B2B_SESSION_SECRET = 'a-long-test-only-business-session-secret'
  })

  afterEach(() => {
    delete process.env.B2B_SESSION_SECRET
  })

  it('rejects a tampered session signature', () => {
    const valid = createBusinessSession(subject)

    expect(readBusinessSession(`${valid}-tampered`)).toBeNull()
  })

  it('invalidates a session when CRM reports a changed session version', async () => {
    const token = createBusinessSession(subject)
    const sessionVersionChangedCrm = {
      getSession: async () => ({
        subject: { ...subject, sessionVersion: 4 },
        business: { id: 'business-1', name: 'מספרת דנה' },
        member: { name: 'דנה', email: 'owner@example.com' },
      }),
    }

    await expect(requireBusinessSession({ token, crm: sessionVersionChangedCrm })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
