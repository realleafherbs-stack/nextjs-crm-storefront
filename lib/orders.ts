// Nothing about a checkout becomes an Order in the CRM until payment is
// confirmed. The full order is staged server-side (CRM's CheckoutIntent,
// keyed by orderId) before the customer is sent to pay, and consumed
// exactly once — turned into a real, already-paid Order — when Hyp
// redirects the customer back with that same order id.
const ORDER_ID_PATTERN = /^HT-\d+-[a-f0-9]{8}$/;

interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  address: string;
  city: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  variantId?: string;
}

export interface OrderPayload {
  total: number;
  shipping: number;
  discount: number;
  coupon?: string;
  customer: OrderCustomer;
  items: OrderItem[];
}

async function postToCrm(path: string, body?: unknown): Promise<boolean> {
  const url = `${process.env.CRM_URL}/api/${process.env.CRM_SITE_SLUG}${path}`;
  const attempts = 3;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CRM_API_KEY!,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (res.ok) return true;
    } catch {
      // fall through to retry
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  return false;
}

export async function stageCheckoutIntent(orderId: string, payload: OrderPayload): Promise<boolean> {
  if (!ORDER_ID_PATTERN.test(orderId)) return false;
  return postToCrm("/checkout-intents", { id: orderId, payload });
}

export async function finalizeOrder(orderId: string): Promise<boolean> {
  if (!ORDER_ID_PATTERN.test(orderId)) return false;
  return postToCrm(`/checkout-intents/${encodeURIComponent(orderId)}/finalize`);
}
