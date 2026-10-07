import { NextRequest, NextResponse } from 'next/server'
import { sendMetaCapiEvent } from '../../../lib/metaCapi'
import { businessCrm, BUSINESS_ORDER_ID_PATTERN } from '../../../lib/business-crm'
import { encodePaymentReceipt, HypPaymentError, VERIFIED_PAYMENT_RECEIPT_COOKIE, verifyHypReturn } from '../../../lib/hyp'
import { finalizeOrder, getStagedCheckoutIntent } from '../../../lib/orders'
import { paymentReturnFailurePath } from '../../../lib/payment-return'

function failureResponse(request: NextRequest, { orderId = null, reason = null }: { orderId?: string | null; reason?: string | null } = {}) {
  return NextResponse.redirect(new URL(paymentReturnFailurePath({ orderId, reason }), request.url))
}

function failureReason(error: unknown): string {
  if (!(error instanceof HypPaymentError)) return 'UNKNOWN'
  return error.gatewayCode ? `HYP_VERIFY_${error.gatewayCode}` : error.code
}

export async function GET(request: NextRequest) {
  const returnParams = request.nextUrl.searchParams
  const rawReturnQuery = request.nextUrl.search.startsWith('?') ? request.nextUrl.search.slice(1) : ''
  const orderId = returnParams.get('Order')
  if (!orderId) return failureResponse(request)
  const businessOrder = BUSINESS_ORDER_ID_PATTERN.test(orderId)

  const staged = businessOrder
    ? await businessCrm.getBusinessPaymentIntent(orderId).catch(() => null)
    : await getStagedCheckoutIntent(orderId)
  if (!staged) return failureResponse(request, { orderId, reason: 'MISSING_INTENT' })

  try {
    const verifiedPayment = await verifyHypReturn(returnParams, staged, rawReturnQuery)
    if (businessOrder) {
      const finalized = await businessCrm.finalizeBusinessOrder(orderId, verifiedPayment)
      // Only the call that actually marked the order paid sends it, so a retried return never double-counts.
      if (finalized.order) {
        try {
          await sendMetaCapiEvent({
            event: 'Purchase',
            value: finalized.order.total,
            orderId,
            contentIds: finalized.order.productIds,
            email: finalized.order.customerEmail || undefined,
            phone: finalized.order.customerPhone || undefined,
            clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') ?? undefined,
          })
        } catch (error) {
          console.error('[hyp-return] Meta CAPI business Purchase failed:', error)
        }
      }
    } else {
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
    }

    const response = NextResponse.redirect(new URL(businessOrder ? '/business/account?payment=success' : '/payment/success', request.url))
    response.cookies.set({
      name: VERIFIED_PAYMENT_RECEIPT_COOKIE,
      value: encodePaymentReceipt({ orderId, amount: verifiedPayment.amount, ...(businessOrder ? { channel: 'business' as const } : {}) }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[hyp-return] HYP verification failed:', error instanceof Error ? error.name : error)
    return failureResponse(request, {
      orderId,
      reason: failureReason(error),
    })
  }
}
