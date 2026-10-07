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
