import { headers } from "next/headers";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SuccessClient from "./SuccessClient";
import { finalizeOrder } from "../../../lib/orders";
import { sendMetaCapiEvent } from "../../../lib/metaCapi";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ Order?: string; Amount?: string }>;
}) {
  const { Order: orderId = "", Amount: amount = "" } = await searchParams;

  // KNOWN LIMITATION: this trusts the client-supplied orderId without
  // verifying with Hyp that a payment actually occurred — see the same
  // note in app/api/confirm-order/route.ts for details and the accepted-risk
  // rationale.
  if (orderId) {
    const order = await finalizeOrder(orderId);
    // Fired here (server-side, during this same request) rather than from
    // SuccessClient's client-side effect — a customer who closes the
    // browser the instant Hyp redirects them still gets counted, since this
    // runs before any HTML/JS reaches them. event_id = orderId so Meta
    // dedupes against the GTM-configured pixel tag firing the same
    // transaction_id client-side.
    if (order) {
      const h = await headers();
      await sendMetaCapiEvent({
        event: "Purchase",
        value: Number(amount) || order.total,
        orderId,
        contentIds: order.items.map((i) => i.id),
        email: order.customerEmail || undefined,
        phone: order.customerPhone || undefined,
        clientIp: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: h.get("user-agent") ?? undefined,
      });
    }
  }

  return (
    <>
      <Navbar />
      <main id="main" className="payment-result">
        <SuccessClient orderId={orderId} amount={amount} />
      </main>
      <Footer />
    </>
  );
}
