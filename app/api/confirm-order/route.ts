import { NextResponse } from "next/server";

// Order finalization is intentionally server-only in /api/hyp-return after
// HYP's APISign/VERIFY check. This legacy browser endpoint stays closed.
export async function POST() {
  return NextResponse.json({ error: "Order confirmation is handled securely by the payment return" }, { status: 410 });
}
