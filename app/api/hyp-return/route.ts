import { NextRequest, NextResponse } from 'next/server'
import { sendMetaCapiEvent } from '../../../lib/metaCapi'
import { encodePaymentReceipt, VERIFIED_PAYMENT_RECEIPT_COOKIE, verifyHypReturn } from '../../../lib/hyp'
import { finalizeOrder, getStagedCheckoutIntent } from '../../../lib/orders'

function failureResponse(request: NextRequest) {
  return NextResponse.redirect(new URL('/payment/failure', request.url))
}

export async function GET(request: NextRequest) {
  const returnParams = request.nextUrl.searchParams
  const orderId = returnParams.get('Order')
  if (!orderId) return failureResponse(request)

  const staged = await getStagedCheckoutIntent(orderId)
  if (!staged) return failureResponse(request)

  try {
    const verifiedPayment = await verifyHypReturn(returnParams, staged)
    const finalized = await finalizeOrder(orderId, verifiedPayment)
    if (!finalized) return failureResponse(request)

    if (finalized.order) {
      try {
        await sendMetaCapiEvent({
          event: 'Purchase',
          value: finalized.order.total,
          orderId,
          contentIds: finalized.order.items.map((item) => item.id),
          email: finalized.order.customerEmail || undefined,
          phone: finalized.order.customerPhone || undefined,
          clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') ?? undefined,
        })
      } catch (error) {
        console.error('[hyp-return] Meta CAPI Purchase failed:', error)
      }
    }

    const response = NextResponse.redirect(new URL('/payment/success', request.url))
    response.cookies.set({
      name: VERIFIED_PAYMENT_RECEIPT_COOKIE,
      value: encodePaymentReceipt({ orderId, amount: verifiedPayment.amount }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[hyp-return] HYP verification failed:', error instanceof Error ? error.name : error)
    return failureResponse(request)
  }
}
