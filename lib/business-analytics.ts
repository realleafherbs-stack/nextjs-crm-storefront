'use client'

import { sendGTMEvent } from '@next/third-parties/google'

const CONSENT_STORAGE_KEY = 'htc-israel-cookie-consent-v1'

type BusinessAnalyticsEvent = 'b2b_catalog_view'

// Fired once, only after the CRM has saved the application. Carries no personal
// data; the pixel and GA tags in GTM decide what to do with it under Consent Mode.
export function trackBusinessApplySuccess(leadId: string, businessType: string) {
  try {
    const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= [])
    dataLayer.push({ event: 'business_apply_success', lead_id: leadId, business_type: businessType })
  } catch {
    // Analytics must never interfere with the confirmation the applicant sees.
  }
}

export function trackBusinessEvent(event: BusinessAnalyticsEvent) {
  try {
    const preferences = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null') as { analytics?: unknown } | null
    if (preferences?.analytics !== true) return
    sendGTMEvent({ event, commerce_channel: 'b2b' })
  } catch {
    // Analytics must never interfere with a protected business workflow.
  }
}

const PURCHASE_TRACKED_PREFIX = 'htc-business-purchase-tracked-'

export type BusinessPurchaseItem = { productId: string; productName: string; grossUnitPrice: number; quantity: number }

// Fired once per verified business order. The landing URL stays valid for a while,
// so a reload (or a second tab) must not push the same purchase again.
export function trackBusinessPurchase({ orderId, amount, items }: { orderId: string; amount: number; items: BusinessPurchaseItem[] }) {
  try {
    const key = `${PURCHASE_TRACKED_PREFIX}${orderId}`
    try {
      if (window.localStorage.getItem(key)) return
    } catch {
      // Storage unavailable: still track rather than lose the conversion.
    }
    const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= [])
    dataLayer.push({ ecommerce: null })
    dataLayer.push({
      event: 'purchase',
      customer_type: 'business',
      ecommerce: {
        transaction_id: orderId,
        currency: 'ILS',
        value: amount,
        items: items.map((item) => ({ item_id: item.productId, item_name: item.productName, price: item.grossUnitPrice, quantity: item.quantity })),
      },
    })
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // Best effort only.
    }
  } catch {
    // Analytics must never interfere with the confirmation the customer sees.
  }
}
