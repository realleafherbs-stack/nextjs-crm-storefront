import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { BusinessCrmError, businessCrm } from '../../../lib/business-crm'
import {
  BUSINESS_SESSION_COOKIE,
  businessSessionCookieOptions,
  BusinessSessionError,
  requireBusinessSession,
} from '../../../lib/business-session'

export const businessPrivateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

export async function requireCurrentBusinessSession() {
  const token = (await cookies()).get(BUSINESS_SESSION_COOKIE)?.value
  return requireBusinessSession({ token, crm: businessCrm })
}

export function businessRouteError(error: unknown): NextResponse {
  if (error instanceof BusinessSessionError) {
    const status = error.code === 'CONFIGURATION' ? 500 : error.code === 'BUSINESS_INACTIVE' ? 403 : 401
    const response = NextResponse.json({ error: error.message }, { status, headers: businessPrivateHeaders })
    if (error.code === 'UNAUTHENTICATED') response.cookies.set({ name: BUSINESS_SESSION_COOKIE, value: '', ...businessSessionCookieOptions(), maxAge: 0 })
    return response
  }
  if (error instanceof BusinessCrmError) {
    return NextResponse.json({ error: error.message }, { status: error.status >= 400 && error.status < 600 ? error.status : 502, headers: businessPrivateHeaders })
  }
  console.error('[business] unexpected proxy error', error)
  return NextResponse.json({ error: 'לא ניתן להשלים את הפעולה כעת' }, { status: 500, headers: businessPrivateHeaders })
}
