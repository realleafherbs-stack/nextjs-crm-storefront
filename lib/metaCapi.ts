import crypto from "node:crypto";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface MetaCapiEvent {
  event: "AddToCart" | "Purchase";
  contentIds?: string[];
  value: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
  orderId?: string;
  email?: string;
  phone?: string;
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
  if (evt.clientIp) userData.client_ip_address = evt.clientIp;
  if (evt.userAgent) userData.client_user_agent = evt.userAgent;

  const payload = {
    data: [
      {
        event_name: evt.event,
        event_time: Math.floor(Date.now() / 1000),
        // Must exactly match the eventID the browser-side pixel sends for the
        // same transaction, or Meta can't deduplicate and double-counts it.
        event_id: evt.orderId,
        action_source: "website",
        event_source_url: evt.eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency: evt.currency ?? "ILS",
          value: evt.value,
          content_ids: evt.contentIds ?? (evt.contentId ? [evt.contentId] : undefined),
          content_name: evt.contentName,
          content_type: "product",
          order_id: evt.orderId,
        },
      },
    ],
  };

  try {
    // access_token goes in the body, not the URL — keeps it out of server/proxy access logs.
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
    });
    if (!res.ok) {
      console.error("[meta-capi] Meta returned an error, status:", res.status);
    }
  } catch {
    console.error("[meta-capi] send failed");
  }
}
