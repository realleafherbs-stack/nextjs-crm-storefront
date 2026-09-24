import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סטטוס תשלום | HTC ישראל",
  robots: { index: false, follow: false },
};

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
