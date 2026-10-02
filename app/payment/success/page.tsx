import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SuccessClient from "./SuccessClient";
import { decodePaymentReceipt, VERIFIED_PAYMENT_RECEIPT_COOKIE } from "../../../lib/hyp";

type PaymentReturnSearchParams = Record<string, string | string[] | undefined>;

function getDirectHypReturnQuery(searchParams: PaymentReturnSearchParams) {
  const requiredKeys = ["Order", "Amount", "CCode", "Sign"] as const;
  if (!requiredKeys.every((key) => typeof searchParams[key] === "string" && searchParams[key].trim())) return null;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.append(key, value);
  }
  return params.toString();
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<PaymentReturnSearchParams> }) {
  const directHypReturnQuery = getDirectHypReturnQuery(await searchParams);

  // Older HYP configurations may return directly here. The API endpoint is the
  // sole place that verifies the payment before finalizing an order.
  if (directHypReturnQuery) redirect(`/api/hyp-return?${directHypReturnQuery}`);

  const receipt = decodePaymentReceipt((await cookies()).get(VERIFIED_PAYMENT_RECEIPT_COOKIE)?.value);

  return (
    <>
      <Navbar />
      <main id="main" className="payment-result">
        <SuccessClient orderId={receipt?.orderId ?? ""} amount={receipt ? String(receipt.amount) : ""} verified={Boolean(receipt)} business={receipt?.channel === 'business'} />
      </main>
      <Footer />
    </>
  );
}
