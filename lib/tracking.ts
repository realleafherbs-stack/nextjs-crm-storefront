'use client'

import { sendGTMEvent } from '@next/third-parties/google'

export type FunnelItem = { id: string; name: string; price: number; quantity: number }
type MetaFunnelEvent = 'AddToCart' | 'InitiateCheckout' | 'AddPaymentInfo'

export function newEventId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// One user action, reported twice: a dataLayer push (GA4 + the Meta Pixel tag in GTM)
// and a server-side Conversions API call. Both carry the same event_id so Meta can
// merge them instead of counting the action twice.
export function trackFunnelEvent({ ga4Event, metaEvent, items, value, contact }: {
  ga4Event: 'add_to_cart' | 'begin_checkout' | 'add_payment_info'
  metaEvent: MetaFunnelEvent
  items: FunnelItem[]
  value: number
  contact?: { email?: string; phone?: string }
}): string {
  const eventId = newEventId()
  sendGTMEvent({ ecommerce: null })
  sendGTMEvent({
    event: ga4Event,
    event_id: eventId,
    ecommerce: {
      currency: 'ILS',
      value,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    },
  })
  // keepalive lets the request finish even when the page navigates away (e.g. to the payment page).
  fetch('/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      event: metaEvent,
      eventId,
      value,
      contentIds: items.map((i) => i.id),
      ...(contact?.email ? { email: contact.email } : {}),
      ...(contact?.phone ? { phone: contact.phone } : {}),
    }),
  }).catch(() => {})
  return eventId
}
