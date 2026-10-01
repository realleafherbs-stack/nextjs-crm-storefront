'use client'

import { sendGTMEvent } from '@next/third-parties/google'

const CONSENT_STORAGE_KEY = 'htc-israel-cookie-consent-v1'

type BusinessAnalyticsEvent = 'b2b_catalog_view'

export function trackBusinessEvent(event: BusinessAnalyticsEvent) {
  try {
    const preferences = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null') as { analytics?: unknown } | null
    if (preferences?.analytics !== true) return
    sendGTMEvent({ event, commerce_channel: 'b2b' })
  } catch {
    // Analytics must never interfere with a protected business workflow.
  }
}
