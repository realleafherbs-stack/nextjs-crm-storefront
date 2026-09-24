import type { Metadata, MetadataRoute } from "next";
import { WARRANTY_FAQ_ANSWER, type ProductContent } from "./product-content";
import type { StoreProduct } from "./products-data";

export const DEFAULT_SITE_URL = "https://www.htcpro.co.il";

type JsonLd = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

function normalizedSiteUrl(siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL) {
  return siteUrl.replace(/\/+$/, "");
}

function absoluteUrl(value: string, siteUrl: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, `${normalizedSiteUrl(siteUrl)}/`).toString();
}

function productDisplayName(product: StoreProduct) {
  return product.name.split(" - ")[0].trim();
}

function productCanonical(product: StoreProduct, siteUrl: string) {
  return product.canonicalUrl
    ? absoluteUrl(product.canonicalUrl, siteUrl)
    : absoluteUrl(`/shop/${encodeURIComponent(product.handle)}`, siteUrl);
}

export function buildProductMetadata(
  product: StoreProduct,
  content: ProductContent,
  siteUrl = DEFAULT_SITE_URL
): Metadata {
  const model = product.handle.toUpperCase();
  const title = product.metaTitle || `${productDisplayName(product)} ${model} | ${content.subtitle}`;
  const description = product.metaDescription || `${productDisplayName(product)} ${model}: ${content.description} מחיר ₪${product.price}, 12 חודשי אחריות יבואן רשמי ומשלוח מהיר בישראל.`;
  const canonical = productCanonical(product, siteUrl);
  const image = absoluteUrl(product.ogImage || product.image, siteUrl);
  const indexable = product.indexable !== false;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName: "HTC ישראל",
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: product.name }],
    },
  };
}

export function buildProductStructuredData(
  product: StoreProduct,
  content: ProductContent,
  siteUrl = DEFAULT_SITE_URL
): JsonLd {
  const canonical = productCanonical(product, siteUrl);
  const model = product.handle.toUpperCase();
  const images = [...new Set([product.image, ...product.images].filter(Boolean))].map((image) => absoluteUrl(image, siteUrl));
  const availability = (product.stock ?? 999) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const questions = [
    ["מה המפרט והביצועים של המוצר?", `${content.description} תכונות מרכזיות: ${content.notes.join(" · ")}.`],
    ["מה מגיע באריזה?", content.boxContents],
    ["מה זמן הטעינה והעבודה?", content.powerInfo],
    ["מה כוללת האחריות?", WARRANTY_FAQ_ANSWER],
  ];

  const productSchema: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: product.name,
    description: content.description,
    url: canonical,
    image: images,
    sku: model,
    model,
    brand: { "@type": "Brand", name: "HTC" },
    category: product.category.name,
    offers: {
      "@type": "Offer",
      url: canonical,
      price: product.price,
      priceCurrency: "ILS",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${normalizedSiteUrl(siteUrl)}/#organization` },
    },
  };

  if (/^\d{13}$/.test(product.gtin)) productSchema.gtin13 = product.gtin;

  return {
    "@context": "https://schema.org",
    "@graph": [
      productSchema,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "דף הבית", item: `${normalizedSiteUrl(siteUrl)}/` },
          { "@type": "ListItem", position: 2, name: "כל הדגמים", item: `${normalizedSiteUrl(siteUrl)}/shop` },
          { "@type": "ListItem", position: 3, name: productDisplayName(product), item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: questions.map(([name, text]) => ({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        })),
      },
    ],
  };
}

export function buildSiteStructuredData(siteUrl = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizedSiteUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "HTC ישראל",
        url: `${baseUrl}/`,
        logo: `${baseUrl}/assets/brand/htc-logo-black.png`,
        description: "מכונות תספורת, טרימרים ומכונות גילוח HTC עם אחריות ושירות בישראל.",
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: "HTC ישראל",
        url: `${baseUrl}/`,
        inLanguage: "he-IL",
        publisher: { "@id": `${baseUrl}/#organization` },
      },
    ],
  };
}

export function buildSitemapEntries(
  products: StoreProduct[],
  siteUrl = DEFAULT_SITE_URL
): MetadataRoute.Sitemap {
  const baseUrl = normalizedSiteUrl(siteUrl);
  const pages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/compare`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/warranty`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/shipping`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/accessibility`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const productPages: MetadataRoute.Sitemap = products
    .filter((product) => product.indexable !== false)
    .map((product) => ({
      url: productCanonical(product, baseUrl),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  return [...pages, ...productPages];
}
