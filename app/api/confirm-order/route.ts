import { NextRequest, NextResponse } from "next/server";
import { finalizeOrder } from "../../../lib/orders";

// Client-side backup — the server-side finalize on the success page's
// initial load (Task 22) is the primary path, but if that whole request
// never completed (browser closed mid-redirect, etc.), this fires once the
// page actually renders. Idempotent server-side, safe to call more than once.
//
// KNOWN LIMITATION: neither this route nor the success page's server-side
// finalize call verifies with Hyp that a payment actually occurred — both
// trust whatever orderId the client presents, and that id is not secret
// (it's echoed back in the paymentUrl returned by /api/hyp-checkout, before
// any payment happens). This mirrors the same pattern in xvape/polarizedx's
// reference implementation this project was built from, and needs the same
// fix everywhere: a Hyp server-to-server IPN callback with signature
// verification, or a call to a Hyp transaction-lookup API before finalizing.
// Flagged during this project's build (2026-08-16); not fixed here per an
// explicit decision to document rather than guess at an unverified Hyp API.
export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }
  const order = await finalizeOrder(orderId);
  return NextResponse.json({ ok: order !== null });
}
