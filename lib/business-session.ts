import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000

export const BUSINESS_SESSION_COOKIE = 'htc_business_session'

export function businessSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    // API proxy routes live at /api/business, so /business would prevent
    // the browser from sending this HttpOnly cookie to their server boundary.
    path: '/',
    maxAge: Math.floor(SESSION_LIFETIME_MS / 1000),
  }
}

export type BusinessSessionSubject = {
  siteId: string
  memberId: string
  businessId: string
  sessionVersion: number
  expiresAt: number
}

export type BusinessCrmSession = {
  subject: Omit<BusinessSessionSubject, 'expiresAt'>
  business: { id: string; name: string }
  member: { name: string; email: string }
}

export interface BusinessSessionCrm {
  getSession(subject: Omit<BusinessSessionSubject, 'expiresAt'>): Promise<BusinessCrmSession>
}

export class BusinessSessionError extends Error {
  constructor(public readonly code: 'UNAUTHENTICATED' | 'BUSINESS_INACTIVE' | 'CONFIGURATION', message: string) {
    super(message)
    this.name = 'BusinessSessionError'
  }
}

function sessionSecret(): string {
  const secret = process.env.B2B_SESSION_SECRET
  if (!secret || secret.length < 24) throw new BusinessSessionError('CONFIGURATION', 'הגדרת ההתחברות העסקית אינה זמינה')
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function isValidSubject(value: unknown, now: number): value is BusinessSessionSubject {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<BusinessSessionSubject>
  return (
    typeof candidate.siteId === 'string' && Boolean(candidate.siteId) &&
    typeof candidate.memberId === 'string' && Boolean(candidate.memberId) &&
    typeof candidate.businessId === 'string' && Boolean(candidate.businessId) &&
    typeof candidate.sessionVersion === 'number' && Number.isInteger(candidate.sessionVersion) && candidate.sessionVersion >= 0 &&
    typeof candidate.expiresAt === 'number' && Number.isFinite(candidate.expiresAt) && candidate.expiresAt > now
  )
}

export function createBusinessSession(
  subject: Omit<BusinessSessionSubject, 'expiresAt'>,
  now = Date.now(),
): string {
  const payload = Buffer.from(JSON.stringify({ ...subject, expiresAt: now + SESSION_LIFETIME_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readBusinessSession(token: string | undefined, now = Date.now()): BusinessSessionSubject | null {
  if (!token) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload))) return null
  try {
    const subject = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return isValidSubject(subject, now) ? subject : null
  } catch {
    return null
  }
}

export async function requireBusinessSession({
  token,
  crm,
}: {
  token: string | undefined
  crm: BusinessSessionCrm
}): Promise<BusinessCrmSession> {
  const subject = readBusinessSession(token)
  if (!subject) throw new BusinessSessionError('UNAUTHENTICATED', 'ההתחברות העסקית אינה תקפה')

  const expected = {
    siteId: subject.siteId,
    memberId: subject.memberId,
    businessId: subject.businessId,
    sessionVersion: subject.sessionVersion,
  }
  let current: BusinessCrmSession
  try {
    current = await crm.getSession(expected)
  } catch (error) {
    if (error instanceof BusinessSessionError) throw error
    throw new BusinessSessionError('UNAUTHENTICATED', 'ההתחברות העסקית אינה תקפה')
  }
  if (
    current.subject.siteId !== expected.siteId ||
    current.subject.memberId !== expected.memberId ||
    current.subject.businessId !== expected.businessId ||
    current.subject.sessionVersion !== expected.sessionVersion
  ) {
    throw new BusinessSessionError('UNAUTHENTICATED', 'ההתחברות העסקית השתנתה. יש להתחבר מחדש')
  }
  return current
}
