import { NextResponse } from 'next/server'
import { BUSINESS_SESSION_COOKIE, businessSessionCookieOptions } from '../../../../lib/business-session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({ name: BUSINESS_SESSION_COOKIE, value: '', ...businessSessionCookieOptions(), maxAge: 0 })
  return response
}
