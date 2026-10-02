type PaymentReturnFailure = {
  orderId: string | null
  reason: string | null
}

// The payment page receives this URL after a signed return that could not be
// reconciled. Keep only the order reference and a non-sensitive category —
// never reflect the gateway payload, card data, or an HYP response.
export function paymentReturnFailurePath({ orderId, reason }: PaymentReturnFailure): string {
  const query = new URLSearchParams()
  if (orderId) query.set('Order', orderId)
  if (reason) query.set('reason', reason)
  const suffix = query.toString()
  return suffix ? `/payment/failure?${suffix}` : '/payment/failure'
}
