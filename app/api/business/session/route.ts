import { NextResponse } from 'next/server'
import { businessPrivateHeaders, businessRouteError, requireCurrentBusinessSession } from '../_shared'

export async function GET() {
  try {
    const session = await requireCurrentBusinessSession()
    return NextResponse.json(session, { headers: businessPrivateHeaders })
  } catch (error) {
    return businessRouteError(error)
  }
}
