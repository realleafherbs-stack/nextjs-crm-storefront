import { NextResponse } from 'next/server'
import { businessCrm } from '../../../../lib/business-crm'
import { businessPrivateHeaders, businessRouteError, requireCurrentBusinessSession } from '../_shared'

export async function GET() {
  try {
    const session = await requireCurrentBusinessSession()
    const items = await businessCrm.getCatalog(session.subject)
    return NextResponse.json(items, { headers: businessPrivateHeaders })
  } catch (error) {
    return businessRouteError(error)
  }
}
