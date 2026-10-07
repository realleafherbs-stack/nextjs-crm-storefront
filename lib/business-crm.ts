import type { BusinessCrmSession, BusinessSessionSubject } from './business-session'

export class BusinessCrmError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'BusinessCrmError'
  }
}

type BusinessSubject = Omit<BusinessSessionSubject, 'expiresAt'>
export type BusinessAuthResult = { subject: BusinessSubject }

export type BusinessCatalogItem = {
  productId: string
  handle: string
  name: string
  image: string | null
  imageAlt: string | null
  sku: string | null
  stock: number | null
  minQuantity: number
  quantityIncrement: number
  maxQuantity: number | null
  netUnitPrice: number
  vatRate: number
  grossUnitPrice: number
}

export type BusinessDeliveryInput = {
  name: string
  email: string
  phone: string
  street: string
  houseNumber: string
  apartment?: string
  city: string
  notes?: string
}

export type BusinessOrderLine = { productId: string; quantity: number }

export type BusinessFinalizedOrder = { total: number; productIds: string[]; customerEmail: string; customerPhone: string }

export type BusinessOrderSummary = {
  id: string
  status: 'AWAITING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'PAYMENT_FAILED'
  netSubtotal: number
  vatAmount: number
  grossTotal: number
  createdAt: string
  paidAt: string | null
  items: Array<{
    productId: string
    productName: string
    sku: string | null
    quantity: number
    netUnitPrice: number
    grossUnitPrice: number
    lineGrossTotal: number
  }>
}

export const BUSINESS_ORDER_ID_PATTERN = /^HTB-\d{13}-[a-f0-9]{8}$/

function config() {
  const crmUrl = process.env.CRM_URL
  const siteSlug = process.env.CRM_SITE_SLUG
  const apiKey = process.env.CRM_API_KEY
  if (!crmUrl || !siteSlug || !apiKey) throw new BusinessCrmError(500, 'מערכת הלקוחות העסקיים אינה מוגדרת')
  return { crmUrl: crmUrl.replace(/\/$/, ''), siteSlug, apiKey }
}

export class BusinessCrmClient {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { crmUrl, siteSlug, apiKey } = config()
    let response: Response
    try {
      response = await fetch(`${crmUrl}/api/${encodeURIComponent(siteSlug)}/b2b${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, ...(init.headers ?? {}) },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw new BusinessCrmError(502, 'לא ניתן להתחבר למערכת הלקוחות העסקיים')
    }
    const data = await response.json().catch(() => ({})) as { error?: unknown }
    if (!response.ok) throw new BusinessCrmError(response.status, typeof data.error === 'string' ? data.error : 'הפעולה נכשלה')
    return data as T
  }

  apply(input: Record<string, unknown>) {
    return this.request<{ ok: true; applicationId: string }>('/applications', { method: 'POST', body: JSON.stringify(input) })
  }

  login(email: string, password: string) {
    return this.request<BusinessAuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  }

  activate(token: string, password: string) {
    return this.request<BusinessAuthResult>('/auth/activate', { method: 'POST', body: JSON.stringify({ token, password }) })
  }

  requestPasswordReset(email: string) {
    return this.request<{ ok: true; resetToken?: string }>('/auth/password-reset', { method: 'POST', body: JSON.stringify({ email }) })
  }

  resetPassword(token: string, password: string) {
    return this.request<{ ok: true }>('/auth/password-reset', { method: 'PUT', body: JSON.stringify({ token, password }) })
  }

  getSession(subject: BusinessSubject) {
    return this.request<BusinessCrmSession>('/auth/session', { method: 'POST', body: JSON.stringify({ subject }) })
  }

  getCatalog(subject: BusinessSubject) {
    return this.request<{ items: BusinessCatalogItem[] }>('/catalog', { method: 'POST', body: JSON.stringify({ subject }) })
  }

  stageBusinessCheckout(subject: BusinessSubject, orderId: string, lines: BusinessOrderLine[], delivery: BusinessDeliveryInput) {
    return this.request<{ orderId: string; amount: number }>('/orders', { method: 'POST', body: JSON.stringify({ action: 'stage', subject, orderId, lines, delivery }) })
  }

  getBusinessPaymentIntent(orderId: string) {
    return this.request<{ orderId: string; amount: number }>('/orders', { method: 'POST', body: JSON.stringify({ action: 'payment-intent', orderId }) })
  }

  finalizeBusinessOrder(orderId: string, verifiedPayment: { orderId: string; amount: number; transactionId: string | null; approvalCode: string | null }) {
    // `order` is present only when this call is the one that marked the order paid.
    return this.request<{ ok: true; already: boolean; order?: BusinessFinalizedOrder }>('/orders', { method: 'POST', body: JSON.stringify({ action: 'finalize', orderId, verifiedPayment }) })
  }

  listBusinessOrders(subject: BusinessSubject) {
    return this.request<{ orders: BusinessOrderSummary[] }>('/orders', { method: 'POST', body: JSON.stringify({ action: 'list', subject }) })
  }

  reorderBusinessOrder(subject: BusinessSubject, orderId: string) {
    return this.request<{ orderId: string; lines: BusinessOrderLine[] }>('/orders', { method: 'POST', body: JSON.stringify({ action: 'reorder', subject, orderId }) })
  }
}

export const businessCrm = new BusinessCrmClient()
