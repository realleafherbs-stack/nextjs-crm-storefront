import { NextRequest, NextResponse } from 'next/server'
import { businessCrm, BUSINESS_ORDER_ID_PATTERN } from '../../../../lib/business-crm'
import { businessPrivateHeaders, businessRouteError, requireCurrentBusinessSession } from '../_shared'

export async function GET() {
  try {
    const session = await requireCurrentBusinessSession()
    const result = await businessCrm.listBusinessOrders(session.subject)
    return NextResponse.json(result, { headers: businessPrivateHeaders })
  } catch (error) {
    return businessRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.orderId !== 'string' || !BUSINESS_ORDER_ID_PATTERN.test(body.orderId)) {
    return NextResponse.json({ error: 'מספר ההזמנה אינו תקין' }, { status: 400, headers: businessPrivateHeaders })
  }
  try {
    const session = await requireCurrentBusinessSession()
    const result = await businessCrm.reorderBusinessOrder(session.subject, body.orderId)
    return NextResponse.json(result, { headers: businessPrivateHeaders })
  } catch (error) {
    return businessRouteError(error)
  }
}
