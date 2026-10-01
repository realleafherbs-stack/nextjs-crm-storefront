import { cookies } from 'next/headers'
import BusinessPageShell from '../_BusinessPage'
import BusinessOrdersClient from './BusinessOrdersClient'
import { decodePaymentReceipt, VERIFIED_PAYMENT_RECEIPT_COOKIE } from '../../../lib/hyp'

export default async function BusinessAccountPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const receipt = decodePaymentReceipt((await cookies()).get(VERIFIED_PAYMENT_RECEIPT_COOKIE)?.value)
  const payment = await searchParams
  return <BusinessPageShell><BusinessOrdersClient paymentConfirmed={payment.payment === 'success' && receipt?.channel === 'business'} /></BusinessPageShell>
}
