import { NextRequest, NextResponse } from 'next/server'
import { businessCrm } from '../../../../lib/business-crm'
import { BUSINESS_SESSION_COOKIE, businessSessionCookieOptions, createBusinessSession } from '../../../../lib/business-session'
import { businessRouteError } from '../_shared'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'פרטי ההתחברות אינם תקינים' }, { status: 400 })
  }
  try {
    const { subject } = await businessCrm.login(body.email, body.password)
    const response = NextResponse.json({ ok: true })
    response.cookies.set({ name: BUSINESS_SESSION_COOKIE, value: createBusinessSession(subject), ...businessSessionCookieOptions() })
    return response
  } catch (error) {
    return businessRouteError(error)
  }
}
