import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import IconSprite from "./components/IconSprite";
import Cart from "./components/Cart";
import CartToast from "./components/CartToast";
import AccessibilityWidget from "./components/AccessibilityWidget";
import CookieConsent from "./components/CookieConsent";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollReveal from "./components/ScrollReveal";
import BodyClassSync from "./components/BodyClassSync";
import { getSiteSeo } from "../lib/seo";

const defaultTitle = "HTC ישראל | מכונות תספורת וגילוח";
const defaultDescription = "HTC ישראל — מכונות תספורת, טרימרים ומכונות גילוח עם אחריות ושירות בישראל.";

// CRM-editable (Settings → SEO → Site-wide) when set, otherwise the
// hardcoded defaults above so the site never ships blank meta tags.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeo();
  const title = seo.metaTitle || defaultTitle;
  const description = seo.metaDescription || defaultDescription;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004"),
    title,
    description,
    manifest: "/site.webmanifest",
    icons: {
      icon: "/assets/brand/htc-logo-black.png",
    },
    ...(seo.ogImage ? { openGraph: { title, description, images: [{ url: seo.ogImage }] } } : {}),
    other: {
      "facebook-domain-verification": "lp9xly4y7wf0pkh0hix9mr45n2fowz",
    },
  };
}

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#11110f",
};

// Kept in sync with middleware.ts's bodyClass assignments. Defense-in-depth
// only — middleware already strips any client-supplied header — but this
// guarantees className can never carry anything except one of these exact,
// known-safe strings.
const ALLOWED_BODY_CLASSES = new Set(["compare-page compare-page--refined", "shop-page", "product-template"]);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestedClass = (await headers()).get("x-body-class") ?? "";
  const bodyClass = ALLOWED_BODY_CLASSES.has(requestedClass) ? requestedClass : "";

  return (
    <html lang="he" dir="rtl">
      <Script id="consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted',
            wait_for_update: 500
          });
        `}
      </Script>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className={bodyClass || undefined}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <a className="skip-link" href="#main">דלגו לתוכן</a>
        <CartProvider>
          {children}
          <Cart />
          <CartToast />
        </CartProvider>
        <AccessibilityWidget />
        <CookieConsent />
        <WhatsAppButton />
        <IconSprite />
        <ScrollReveal />
        <BodyClassSync />
      </body>
    </html>
  );
}
