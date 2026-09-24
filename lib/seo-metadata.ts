import type { Metadata, MetadataRoute } from "next";
import { WARRANTY_FAQ_ANSWER, type ProductContent } from "./product-content";
import type { StoreProduct } from "./products-data";
import type { BlogPost } from "./blogs";

export const DEFAULT_SITE_URL = "https://www.htcpro.co.il";

export function getCanonicalSiteUrl() {
  return (process.env.NEXT_PUBLIC_CANONICAL_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

type JsonLd = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

function normalizedSiteUrl(siteUrl = getCanonicalSiteUrl()) {
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

function blogCanonical(post: BlogPost, siteUrl: string) {
  return post.canonicalUrl
    ? absoluteUrl(post.canonicalUrl, siteUrl)
    : absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`, siteUrl);
}

export function buildBlogMetadata(post: BlogPost, siteUrl = DEFAULT_SITE_URL): Metadata {
  const title = post.metaTitle || `${post.title} | HTC ישראל`;
  const description = post.metaDescription || post.excerpt || post.directAnswer || post.title;
  const canonical = blogCanonical(post, siteUrl);
  const imageValue = post.ogImage || post.featuredImage;
  const image = imageValue ? absoluteUrl(imageValue, siteUrl) : undefined;
  const indexable = post.indexable !== false;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: "article",
      locale: "he_IL",
      siteName: "HTC ישראל",
      title,
      description,
      url: canonical,
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
      ...(post.tags.length ? { tags: post.tags } : {}),
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
  };
}

export function buildBlogStructuredData(post: BlogPost, siteUrl = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizedSiteUrl(siteUrl);
  const canonical = blogCanonical(post, baseUrl);
  const imageValue = post.ogImage || post.featuredImage;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: post.title,
      description: post.metaDescription || post.excerpt || post.directAnswer || post.title,
      mainEntityOfPage: { "@id": canonical },
      ...(imageValue ? { image: absoluteUrl(imageValue, baseUrl) } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
      ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
      ...(post.tags.length ? { keywords: post.tags } : {}),
      author: {
        "@type": "Organization",
        name: post.authorName || "צוות HTC ישראל",
        url: `${baseUrl}/`,
      },
      publisher: { "@id": `${baseUrl}/#organization` },
      inLanguage: "he-IL",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "דף הבית", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "המדריך של HTC", item: `${baseUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    },
  ];

  if (post.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: post.faq.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function buildBlogIndexStructuredData(posts: BlogPost[], siteUrl = DEFAULT_SITE_URL): JsonLd {
  const baseUrl = normalizedSiteUrl(siteUrl);
  const indexablePosts = posts.filter((post) => post.indexable !== false);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${baseUrl}/blog#blog`,
        name: "המדריך של HTC ישראל",
        description: "מדריכים מקצועיים לבחירת מכונות תספורת, טרימרים ומכונות גילוח לבית, למספרה ולעסקים.",
        url: `${baseUrl}/blog`,
        inLanguage: "he-IL",
        publisher: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "ItemList",
        "@id": `${baseUrl}/blog#articles`,
        numberOfItems: indexablePosts.length,
        itemListElement: indexablePosts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: post.title,
          url: blogCanonical(post, baseUrl),
        })),
      },
    ],
  };
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
        legalName: "B2B MARKT LTD",
        url: `${baseUrl}/`,
        logo: `${baseUrl}/assets/brand/htc-logo-black.png`,
        description: "מכונות תספורת, טרימרים ומכונות גילוח HTC עם אחריות ושירות בישראל.",
        email: "service@htc-israel.co.il",
        address: {
          "@type": "PostalAddress",
          streetAddress: "המרכבה 25",
          addressLocality: "חולון",
          addressCountry: "IL",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "service@htc-israel.co.il",
          url: `${baseUrl}/contact`,
          availableLanguage: ["he"],
          areaServed: "IL",
        },
        knowsAbout: ["מכונות תספורת", "טרימרים", "מכונות גילוח", "ציוד למספרות"],
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
  siteUrl = DEFAULT_SITE_URL,
  blogPosts: BlogPost[] = []
): MetadataRoute.Sitemap {
  const baseUrl = normalizedSiteUrl(siteUrl);
  const pages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.75 },
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

  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter((post) => post.indexable !== false)
    .map((post) => ({
      url: blogCanonical(post, baseUrl),
      lastModified: post.updatedAt || post.publishedAt || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  return [...pages, ...productPages, ...blogPages];
}
