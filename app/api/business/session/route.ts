import { NextResponse } from 'next/server'
import { businessRouteError, requireCurrentBusinessSession } from '../_shared'

export async function GET() {
  try {
    const session = await requireCurrentBusinessSession()
    return NextResponse.json(session, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return businessRouteError(error)
  }
}
