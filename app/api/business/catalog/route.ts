import { NextResponse } from 'next/server'
import { businessCrm } from '../../../../lib/business-crm'
import { businessRouteError, requireCurrentBusinessSession } from '../_shared'

export async function GET() {
  try {
    const session = await requireCurrentBusinessSession()
    const items = await businessCrm.getCatalog(session.subject)
    return NextResponse.json(items, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return businessRouteError(error)
  }
}
