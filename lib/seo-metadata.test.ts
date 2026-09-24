import { expect, it } from "vitest";
import type { ProductContent } from "./product-content";
import type { StoreProduct } from "./products-data";
import type { BlogPost } from "./blogs";

const product: StoreProduct = {
  id: "product-at-158",
  handle: "at-158",
  name: "HTC Start - מכונת תספורת ביתית למשפחה",
  price: 99,
  badge: "למשפחה",
  image: "/assets/products/at-158-single-v2.webp",
  images: [
    "/assets/products/at-158-single-v2.webp",
    "/assets/barbershop/at-158-barbershop.jpg",
  ],
  cardFeatures: ["4 מסרקים", "טעינת USB", "לכל המשפחה"],
  category: { id: "clipper", name: "מכונות תספורת", slug: "clipper" },
  categoryOrder: 2,
  gtin: "6971864101933",
  stock: 38,
};

const content: ProductContent = {
  subtitle: "מכונת תספורת ביתית למשפחה",
  description: "טבעת כיוון אורך, מסך דיגיטלי וארבעה מסרקי הגבהה לשימוש ביתי נוח.",
  compareAtPrice: 159,
  notes: ["4 מסרקים"],
  specs: [["סוג", "מכונת תספורת ביתית"]],
  boxContents: "מכונה וארבעה מסרקים.",
  powerInfo: "כבל USB כלול.",
  story: { eyebrow: "HTC HOME", headline: "פשוט בבית", body: "נוחה לשימוש.", benefits: [] },
};

const blogPost: BlogPost = {
  id: "blog-guide",
  title: "איך לבחור מכונת תספורת מקצועית",
  slug: "professional-hair-clipper-guide",
  body: "<p>מדריך מעשי לבחירת מכונת תספורת.</p>",
  excerpt: "כל מה שצריך לבדוק לפני שבוחרים מכונת תספורת מקצועית לבית או למספרה.",
  featuredImage: "/assets/products/at-799-single.jpg",
  metaTitle: "איך לבחור מכונת תספורת מקצועית | HTC ישראל",
  metaDescription: "מדריך לבחירת מכונת תספורת מקצועית לפי סוג שימוש, מנוע, להב, סוללה ואחריות.",
  ogImage: "/assets/products/at-799-single.jpg",
  tags: ["מכונת תספורת מקצועית", "מדריך קנייה"],
  primaryKeyword: "מכונת תספורת מקצועית",
  canonicalUrl: null,
  indexable: true,
  directAnswer: "בוחרים מכונת תספורת לפי תדירות השימוש, סוג הלהב, עוצמת המנוע, זמן העבודה והאחריות.",
  authorName: "צוות HTC ישראל",
  authorRole: "מומחי טיפוח מקצועי",
  reviewedBy: "HTC ישראל",
  contentType: "GUIDE",
  faq: [
    {
      question: "איזו מכונת תספורת מתאימה למספרה?",
      answer: "למספרה כדאי לבחור דגם שמיועד לעבודה ממושכת ומציע שליטה ברורה באורכי החיתוך.",
    },
  ],
  relatedProductIds: ["product-at-158"],
  relatedBlogIds: [],
  publishedAt: "2026-09-25T08:00:00.000Z",
  createdAt: "2026-09-25T07:00:00.000Z",
  updatedAt: "2026-09-25T09:00:00.000Z",
};

it("builds unique product metadata with a canonical URL and share image", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildProductMetadata = "buildProductMetadata" in module ? module.buildProductMetadata : undefined;

  expect(buildProductMetadata).toBeTypeOf("function");
  if (typeof buildProductMetadata !== "function") return;

  const metadata = buildProductMetadata(product, content, "https://www.htcpro.co.il");

  expect(metadata).toMatchObject({
    title: "HTC Start AT-158 | מכונת תספורת ביתית למשפחה",
    description: "HTC Start AT-158: טבעת כיוון אורך, מסך דיגיטלי וארבעה מסרקי הגבהה לשימוש ביתי נוח. מחיר ₪99, 12 חודשי אחריות יבואן רשמי ומשלוח מהיר בישראל.",
    alternates: { canonical: "https://www.htcpro.co.il/shop/at-158" },
    robots: { index: true, follow: true },
    openGraph: {
      url: "https://www.htcpro.co.il/shop/at-158",
      images: [{ url: "https://www.htcpro.co.il/assets/products/at-158-single-v2.webp", alt: "HTC Start - מכונת תספורת ביתית למשפחה" }],
    },
    twitter: { card: "summary_large_image" },
  });
});

it("builds accurate Product, Breadcrumb and FAQ structured data", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildProductStructuredData = "buildProductStructuredData" in module ? module.buildProductStructuredData : undefined;

  expect(buildProductStructuredData).toBeTypeOf("function");
  if (typeof buildProductStructuredData !== "function") return;

  const structuredData = buildProductStructuredData(product, content, "https://www.htcpro.co.il");
  const graph = structuredData["@graph"];

  expect(graph).toContainEqual(expect.objectContaining({
    "@type": "Product",
    name: "HTC Start - מכונת תספורת ביתית למשפחה",
    sku: "AT-158",
    gtin13: "6971864101933",
    image: [
      "https://www.htcpro.co.il/assets/products/at-158-single-v2.webp",
      "https://www.htcpro.co.il/assets/barbershop/at-158-barbershop.jpg",
    ],
    offers: expect.objectContaining({
      price: 99,
      priceCurrency: "ILS",
      availability: "https://schema.org/InStock",
      url: "https://www.htcpro.co.il/shop/at-158",
    }),
  }));
  expect(graph).toContainEqual(expect.objectContaining({ "@type": "BreadcrumbList" }));
  expect(graph).toContainEqual(expect.objectContaining({ "@type": "FAQPage" }));
});

it("builds a sitemap with all indexable products and no transactional pages", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildSitemapEntries = "buildSitemapEntries" in module ? module.buildSitemapEntries : undefined;

  expect(buildSitemapEntries).toBeTypeOf("function");
  if (typeof buildSitemapEntries !== "function") return;

  const hiddenProduct = { ...product, id: "hidden", handle: "hidden-model", indexable: false };
  const hiddenBlog = { ...blogPost, id: "hidden-blog", slug: "hidden-blog", indexable: false };
  const urls = buildSitemapEntries(
    [product, hiddenProduct],
    "https://www.htcpro.co.il",
    [blogPost, hiddenBlog]
  ).map((entry: { url: string }) => entry.url);

  expect(urls).toContain("https://www.htcpro.co.il/");
  expect(urls).toContain("https://www.htcpro.co.il/shop");
  expect(urls).toContain("https://www.htcpro.co.il/shop/at-158");
  expect(urls).toContain("https://www.htcpro.co.il/blog");
  expect(urls).toContain("https://www.htcpro.co.il/blog/professional-hair-clipper-guide");
  expect(urls).not.toContain("https://www.htcpro.co.il/shop/hidden-model");
  expect(urls).not.toContain("https://www.htcpro.co.il/blog/hidden-blog");
  expect(urls).not.toContain("https://www.htcpro.co.il/cart");
  expect(urls).not.toContain("https://www.htcpro.co.il/checkout");
});

it("builds indexable blog metadata with canonical and social image", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildBlogMetadata = "buildBlogMetadata" in module ? module.buildBlogMetadata : undefined;

  expect(buildBlogMetadata).toBeTypeOf("function");
  if (typeof buildBlogMetadata !== "function") return;

  expect(buildBlogMetadata(blogPost, "https://www.htcpro.co.il")).toMatchObject({
    title: "איך לבחור מכונת תספורת מקצועית | HTC ישראל",
    description: "מדריך לבחירת מכונת תספורת מקצועית לפי סוג שימוש, מנוע, להב, סוללה ואחריות.",
    alternates: { canonical: "https://www.htcpro.co.il/blog/professional-hair-clipper-guide" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: "https://www.htcpro.co.il/blog/professional-hair-clipper-guide",
      images: [{ url: "https://www.htcpro.co.il/assets/products/at-799-single.jpg", alt: "איך לבחור מכונת תספורת מקצועית" }],
    },
  });
});

it("builds BlogPosting, Breadcrumb and FAQ structured data from published facts", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildBlogStructuredData = "buildBlogStructuredData" in module ? module.buildBlogStructuredData : undefined;

  expect(buildBlogStructuredData).toBeTypeOf("function");
  if (typeof buildBlogStructuredData !== "function") return;

  const structuredData = buildBlogStructuredData(blogPost, "https://www.htcpro.co.il");

  expect(structuredData["@graph"]).toContainEqual(expect.objectContaining({
    "@type": "BlogPosting",
    headline: "איך לבחור מכונת תספורת מקצועית",
    datePublished: "2026-09-25T08:00:00.000Z",
    dateModified: "2026-09-25T09:00:00.000Z",
    image: "https://www.htcpro.co.il/assets/products/at-799-single.jpg",
    keywords: ["מכונת תספורת מקצועית", "מדריך קנייה"],
    author: expect.objectContaining({ name: "צוות HTC ישראל" }),
  }));
  expect(structuredData["@graph"]).toContainEqual(expect.objectContaining({ "@type": "BreadcrumbList" }));
  expect(structuredData["@graph"]).toContainEqual(expect.objectContaining({ "@type": "FAQPage" }));
});

it("builds a blog index schema that links every indexable article", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildBlogIndexStructuredData = "buildBlogIndexStructuredData" in module ? module.buildBlogIndexStructuredData : undefined;

  expect(buildBlogIndexStructuredData).toBeTypeOf("function");
  if (typeof buildBlogIndexStructuredData !== "function") return;

  const hiddenBlog = { ...blogPost, id: "hidden-blog", slug: "hidden-blog", indexable: false };
  const structuredData = buildBlogIndexStructuredData([blogPost, hiddenBlog], "https://www.htcpro.co.il");

  expect(structuredData["@graph"]).toContainEqual(expect.objectContaining({
    "@type": "Blog",
    url: "https://www.htcpro.co.il/blog",
  }));
  expect(structuredData["@graph"]).toContainEqual(expect.objectContaining({
    "@type": "ItemList",
    numberOfItems: 1,
    itemListElement: [expect.objectContaining({
      position: 1,
      url: "https://www.htcpro.co.il/blog/professional-hair-clipper-guide",
    })],
  }));
});

it("describes the site as the official HTC Israel organization and website", async () => {
  const module = await import("./seo-metadata").catch(() => ({}));
  const buildSiteStructuredData = "buildSiteStructuredData" in module ? module.buildSiteStructuredData : undefined;

  expect(buildSiteStructuredData).toBeTypeOf("function");
  if (typeof buildSiteStructuredData !== "function") return;

  const structuredData = buildSiteStructuredData("https://www.htcpro.co.il");

  expect(structuredData["@graph"]).toEqual([
    expect.objectContaining({
      "@type": "Organization",
      name: "HTC ישראל",
      url: "https://www.htcpro.co.il/",
      logo: "https://www.htcpro.co.il/assets/brand/htc-logo-black.png",
    }),
    expect.objectContaining({
      "@type": "WebSite",
      name: "HTC ישראל",
      url: "https://www.htcpro.co.il/",
      inLanguage: "he-IL",
    }),
  ]);
});
