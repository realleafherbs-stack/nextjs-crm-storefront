import { NextRequest, NextResponse } from 'next/server'
import { businessCrm, type BusinessDeliveryInput, type BusinessOrderLine } from '../../../../lib/business-crm'
import { businessRouteError, requireCurrentBusinessSession } from '../_shared'

function readText(value: unknown, required = false) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string' || !value.trim() || value.length > 500) return undefined
  return value.trim()
}

function readCheckout(value: unknown): { lines: BusinessOrderLine[]; delivery: BusinessDeliveryInput } | null {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  if (!Array.isArray(body.lines) || !body.delivery || typeof body.delivery !== 'object') return null
  const lines = body.lines.map((line) => {
    if (!line || typeof line !== 'object') return null
    const item = line as Record<string, unknown>
    if (typeof item.productId !== 'string' || !item.productId || item.productId.length > 190 || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10_000) return null
    return { productId: item.productId, quantity: item.quantity }
  })
  if (!lines.length || lines.some((line) => line === null)) return null
  const rawDelivery = body.delivery as Record<string, unknown>
  const name = readText(rawDelivery.name, true)
  const email = readText(rawDelivery.email, true)
  const phone = readText(rawDelivery.phone, true)
  const street = readText(rawDelivery.street, true)
  const houseNumber = readText(rawDelivery.houseNumber, true)
  const city = readText(rawDelivery.city, true)
  if (!name || !email || !phone || !street || !houseNumber || !city) return null
  const apartment = readText(rawDelivery.apartment)
  const notes = readText(rawDelivery.notes)
  return { lines: lines as BusinessOrderLine[], delivery: { name, email, phone, street, houseNumber, city, ...(apartment ? { apartment } : {}), ...(notes ? { notes } : {}) } }
}

async function createHypPaymentUrl(orderId: string, amount: number) {
  const masof = process.env.HYP_MASOF
  const key = process.env.HYP_KEY
  const passP = process.env.HYP_PASSP
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!masof || !key || !passP || !siteUrl) throw new Error('HYP configuration is unavailable')
  const params = new URLSearchParams({
    action: 'APISign', What: 'SIGN', Sign: 'True', KEY: key, PassP: passP, Masof: masof,
    Amount: amount.toFixed(2), Coin: '1', Order: orderId, PageLang: 'HEB', sendemail: 'True', MoreData: 'True',
    SuccessUrl: new URL('/api/hyp-return', siteUrl).toString(),
    ErrorUrl: new URL('/payment/failure', siteUrl).toString(),
  })
  const response = await fetch(`https://pay.hyp.co.il/p/?${params.toString()}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
  const signedParams = await response.text()
  if (!response.ok || (signedParams.includes('CCode=') && !signedParams.includes('action=pay'))) throw new Error('HYP signing failed')
  return `https://pay.hyp.co.il/p/?${signedParams}`
}

export async function POST(request: NextRequest) {
  const input = readCheckout(await request.json().catch(() => null))
  if (!input) return NextResponse.json({ error: 'פרטי ההזמנה אינם תקינים' }, { status: 400 })
  try {
    const session = await requireCurrentBusinessSession()
    const orderId = `HTB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const staged = await businessCrm.stageBusinessCheckout(session.subject, orderId, input.lines, input.delivery)
    const paymentUrl = await createHypPaymentUrl(staged.orderId, staged.amount)
    return NextResponse.json({ orderId: staged.orderId, amount: staged.amount, paymentUrl }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return businessRouteError(error)
  }
}
