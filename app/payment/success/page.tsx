import { cookies } from "next/headers";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SuccessClient from "./SuccessClient";
import { decodePaymentReceipt, VERIFIED_PAYMENT_RECEIPT_COOKIE } from "../../../lib/hyp";

export default async function PaymentSuccessPage() {
  const receipt = decodePaymentReceipt((await cookies()).get(VERIFIED_PAYMENT_RECEIPT_COOKIE)?.value);

  return (
    <>
      <Navbar />
      <main id="main" className="payment-result">
        <SuccessClient orderId={receipt?.orderId ?? ""} amount={receipt ? String(receipt.amount) : ""} verified={Boolean(receipt)} />
      </main>
      <Footer />
    </>
  );
}
