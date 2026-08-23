import { NextRequest, NextResponse } from "next/server";
import { stageCheckoutIntent } from "../../../lib/orders";
import { getProducts } from "../../../lib/products";
import { FREE_SHIPPING_THRESHOLD } from "../../../lib/constants";

export interface CheckoutItem {
  id: string;
  qty: number;
}

export interface HypCheckoutBody {
  coupon?: string;
  customer?: {
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
  };
  items?: CheckoutItem[];
}

interface CouponValidation {
  ok: boolean;
  type?: string;
  value?: number;
  code?: string;
  error?: string;
}

async function validateCouponServerSide(code: string): Promise<CouponValidation> {
  try {
    const res = await fetch(`${process.env.CRM_URL}/api/${process.env.CRM_SITE_SLUG}/validate-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "קוד קופון לא תקין" };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "שגיאה באימות הקופון" };
  }
}

export async function POST(req: NextRequest) {
  const masof = process.env.HYP_MASOF;
  const key = process.env.HYP_KEY;
  const passP = process.env.HYP_PASSP;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

  if (!masof || !key || !passP) {
    return NextResponse.json(
      { error: "Hyp Pay credentials not configured. Set HYP_MASOF, HYP_KEY, HYP_PASSP in .env.local" },
      { status: 500 }
    );
  }

  const body: HypCheckoutBody = await req.json();
  const { coupon, customer, items } = body;

  if (
    !customer ||
    !items?.length ||
    typeof customer.email !== "string" || !customer.email.trim() ||
    typeof customer.firstName !== "string" || !customer.firstName.trim() ||
    typeof customer.lastName !== "string" || !customer.lastName.trim() ||
    typeof customer.phone !== "string" || !customer.phone.trim()
  ) {
    return NextResponse.json({ error: "Missing customer or items" }, { status: 400 });
  }

  // Recompute the order total server-side from CRM product data — never
  // trust a client-supplied price or amount.
  const products = await getProducts();
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  // gtin carries the real Payper SKU for CRM-synced products (see
  // lib/products.ts) — passed through as variantId, the field name the
  // CRM's invoice-generation code (lib/payper.ts) already reads to populate
  // Payper's catalog_id on each invoice line.
  const skuById = new Map(products.map((p) => [p.id, p.gtin]));

  let subtotal = 0;
  const orderItems: { id: string; name: string; price: number; qty: number; variantId?: string }[] = [];
  for (const item of items) {
    const price = priceById.get(item.id);
    if (price === undefined) {
      return NextResponse.json({ error: `Unknown item: ${item.id}` }, { status: 400 });
    }
    if (!Number.isFinite(item.qty)) {
      return NextResponse.json({ error: `Invalid quantity for item: ${item.id}` }, { status: 400 });
    }
    const qty = Math.max(1, Math.floor(item.qty));
    subtotal += price * qty;
    const sku = skuById.get(item.id);
    orderItems.push({ id: item.id, name: nameById.get(item.id) ?? item.id, price, qty, ...(sku ? { variantId: sku } : {}) });
  }

  let discount = 0;
  let couponCode: string | undefined;
  if (coupon) {
    const result = await validateCouponServerSide(coupon);
    if (!result.ok || !result.type || result.value === undefined) {
      return NextResponse.json({ error: result.error ?? "קוד קופון לא תקין" }, { status: 400 });
    }
    discount =
      result.type === "PERCENT"
        ? Math.round(((subtotal * result.value) / 100) * 100) / 100
        : Math.min(result.value, subtotal);
    couponCode = result.code;
  }

  const shipping = subtotal === 0 || subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 29;
  const amount = Math.max(0, subtotal - discount) + shipping;

  // Generated server-side — never trust a client-supplied order id.
  const orderId = `HT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const staged = await stageCheckoutIntent(orderId, {
    total: amount,
    shipping,
    discount,
    coupon: couponCode,
    customer,
    items: orderItems,
  });
  if (!staged) {
    return NextResponse.json({ error: "Could not save order. Please try again." }, { status: 502 });
  }

  const params = new URLSearchParams({
    action: "APISign",
    What: "SIGN",
    Sign: "True",
    KEY: key,
    PassP: passP,
    Masof: masof,
    Amount: String(amount),
    Coin: "1",
    Order: orderId,
    PageLang: "HEB",
    sendemail: "True",
    MoreData: "True",
    SuccessUrl: `${siteUrl}/payment/success`,
    ErrorUrl: `${siteUrl}/payment/failure`,
  });

  let signedParams: string;
  try {
    const resp = await fetch(`https://pay.hyp.co.il/p/?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    });
    signedParams = await resp.text();
  } catch (err) {
    console.error("Hyp APISign request failed:", err);
    return NextResponse.json({ error: "Failed to connect to Hyp Pay" }, { status: 502 });
  }

  if (signedParams.includes("CCode=") && !signedParams.includes("action=pay")) {
    console.error("Hyp APISign returned an error:", signedParams);
    return NextResponse.json({ error: "Hyp Pay returned an error" }, { status: 400 });
  }

  const paymentUrl = `https://pay.hyp.co.il/p/?${signedParams}`;
  return NextResponse.json({ paymentUrl, amount });
}
