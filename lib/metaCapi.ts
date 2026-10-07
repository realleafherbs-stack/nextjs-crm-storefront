import crypto from "node:crypto";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta matches on the full international number, digits only. The storefront
// collects Israeli local numbers (050-123-4567), so a leading 0 becomes 972.
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
}

// Meta's fbc format, for when the _fbc cookie is missing but the ad click id is known.
export function buildFbc(fbclid: string, nowMs = Date.now()): string {
  return `fb.1.${nowMs}.${fbclid}`;
}

export interface MetaCapiEvent {
  event: "AddToCart" | "Purchase" | "CompleteRegistration";
  contentIds?: string[];
  // Omitted for registration-style events, which carry no commerce data.
  value?: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
  orderId?: string;
  // Dedup key for events that are not orders; takes precedence over orderId.
  eventId?: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
}

// Sends a server-side event to Meta's Conversions API. Silently no-ops if
// credentials aren't configured, and never throws — analytics must not break checkout.
export async function sendMetaCapiEvent(evt: MetaCapiEvent) {
  const datasetId = process.env.META_CAPI_DATASET_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!datasetId || !accessToken) return;

  const userData: Record<string, unknown> = {};
  if (evt.email) userData.em = [sha256(evt.email)];
  if (evt.phone) userData.ph = [sha256(normalizePhone(evt.phone))];
  if (evt.fbp) userData.fbp = evt.fbp;
  if (evt.fbc) userData.fbc = evt.fbc;
  if (evt.clientIp) userData.client_ip_address = evt.clientIp;
  if (evt.userAgent) userData.client_user_agent = evt.userAgent;

  const payload = {
    data: [
      {
        event_name: evt.event,
        event_time: Math.floor(Date.now() / 1000),
        // Must exactly match the eventID the browser-side pixel sends for the
        // same transaction, or Meta can't deduplicate and double-counts it.
        event_id: evt.eventId ?? evt.orderId,
        action_source: "website",
        event_source_url: evt.eventSourceUrl,
        user_data: userData,
        ...(evt.value === undefined
          ? {}
          : {
              custom_data: {
                currency: evt.currency ?? "ILS",
                value: evt.value,
                content_ids: evt.contentIds ?? (evt.contentId ? [evt.contentId] : undefined),
                content_name: evt.contentName,
                content_type: "product",
                order_id: evt.orderId,
              },
            }),
      },
    ],
  };

  try {
    // access_token goes in the body, not the URL — keeps it out of server/proxy access logs.
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
      // The apply route awaits this; a slow Meta must not hang the form response.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[meta-capi] Meta returned an error, status:", res.status);
    }
  } catch {
    console.error("[meta-capi] send failed");
  }
}
