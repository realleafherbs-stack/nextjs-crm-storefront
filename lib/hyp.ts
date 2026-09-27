const HYP_VERIFY_ENDPOINT = 'https://pay.hyp.co.il/p/'
export const VERIFIED_PAYMENT_RECEIPT_COOKIE = 'htc_verified_payment'

export type VerifiedHypPayment = {
  orderId: string
  amount: number
  transactionId: string | null
  approvalCode: string | null
}

export type VerifiedPaymentReceipt = {
  orderId: string
  amount: number
  channel?: 'business'
}

export class HypPaymentError extends Error {
  constructor(
    public readonly code: 'INVALID_PAYMENT' | 'AMOUNT_MISMATCH' | 'HYP_CONFIGURATION' | 'HYP_UNAVAILABLE',
    message: string,
  ) {
    super(message)
    this.name = 'HypPaymentError'
  }
}

export function encodePaymentReceipt(receipt: VerifiedPaymentReceipt): string {
  return encodeURIComponent(JSON.stringify({ v: 1, o: receipt.orderId, a: receipt.amount, ...(receipt.channel ? { c: receipt.channel } : {}) }))
}

export function decodePaymentReceipt(value: string | undefined): VerifiedPaymentReceipt | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as { v?: unknown; o?: unknown; a?: unknown; c?: unknown }
    if (parsed.v !== 1 || typeof parsed.o !== 'string' || !parsed.o || typeof parsed.a !== 'number' || !Number.isFinite(parsed.a) || parsed.a < 0 || (parsed.c !== undefined && parsed.c !== 'business')) {
      return null
    }
    return { orderId: parsed.o, amount: Math.round((parsed.a + Number.EPSILON) * 100) / 100, ...(parsed.c === 'business' ? { channel: 'business' as const } : {}) }
  } catch {
    return null
  }
}

function toCurrency(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null
}

function sameCurrency(left: number, right: number): boolean {
  return Math.round((left + Number.EPSILON) * 100) === Math.round((right + Number.EPSILON) * 100)
}

function requiredParam(params: URLSearchParams, key: string): string {
  const value = params.get(key)
  if (!value) throw new HypPaymentError('INVALID_PAYMENT', 'התקבלה תשובת תשלום לא תקינה')
  return value
}

function readVerifiedAuditField(params: URLSearchParams, key: string): string | null {
  const value = params.get(key)
  return value?.trim() || null
}

export async function verifyHypReturn(
  returnParams: URLSearchParams,
  expected: { orderId: string; amount: number },
): Promise<VerifiedHypPayment> {
  const masof = process.env.HYP_MASOF
  const key = process.env.HYP_KEY
  const passP = process.env.HYP_PASSP
  if (!masof || !key || !passP) {
    throw new HypPaymentError('HYP_CONFIGURATION', 'הגדרת התשלום אינה זמינה')
  }

  const orderId = requiredParam(returnParams, 'Order')
  const redirectAmount = toCurrency(requiredParam(returnParams, 'Amount'))
  const redirectCode = requiredParam(returnParams, 'CCode')
  requiredParam(returnParams, 'Sign')

  if (redirectCode !== '0' || orderId !== expected.orderId) {
    throw new HypPaymentError('INVALID_PAYMENT', 'אימות התשלום נכשל')
  }
  if (redirectAmount === null || !sameCurrency(redirectAmount, expected.amount)) {
    throw new HypPaymentError('AMOUNT_MISMATCH', 'סכום התשלום אינו תואם להזמנה')
  }

  const verifyParams = new URLSearchParams({
    action: 'APISign',
    What: 'VERIFY',
    Masof: masof,
    KEY: key,
    PassP: passP,
  })
  // HYP verifies the parameters in the exact redirect order, so do not turn
  // this into an object or sort it before sending the server-to-server check.
  for (const [name, value] of returnParams.entries()) verifyParams.append(name, value)

  let response: Response
  try {
    response = await fetch(`${HYP_VERIFY_ENDPOINT}?${verifyParams.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new HypPaymentError('HYP_UNAVAILABLE', 'לא ניתן לאמת את התשלום כרגע')
  }
  if (!response.ok) throw new HypPaymentError('HYP_UNAVAILABLE', 'לא ניתן לאמת את התשלום כרגע')

  const verified = new URLSearchParams((await response.text()).trim().replace(/^\?/, ''))
  if (verified.get('CCode') !== '0') {
    throw new HypPaymentError('INVALID_PAYMENT', 'אימות התשלום נכשל')
  }

  const verifiedOrder = verified.get('Order')
  if (verifiedOrder && verifiedOrder !== expected.orderId) {
    throw new HypPaymentError('INVALID_PAYMENT', 'אימות התשלום נכשל')
  }
  const verifiedAmountRaw = verified.get('Amount')
  if (verifiedAmountRaw) {
    const verifiedAmount = toCurrency(verifiedAmountRaw)
    if (verifiedAmount === null || !sameCurrency(verifiedAmount, expected.amount)) {
      throw new HypPaymentError('AMOUNT_MISMATCH', 'סכום התשלום אינו תואם להזמנה')
    }
  }

  return {
    orderId: expected.orderId,
    amount: Math.round((expected.amount + Number.EPSILON) * 100) / 100,
    transactionId: readVerifiedAuditField(returnParams, 'TransID') ?? readVerifiedAuditField(verified, 'TransID'),
    approvalCode: readVerifiedAuditField(returnParams, 'ApprovalCode') ?? readVerifiedAuditField(verified, 'ApprovalCode'),
  }
}
