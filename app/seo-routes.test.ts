import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

it("serves robots rules that advertise the live sitemap", async () => {
  const module = await import("./robots").catch(() => ({}));
  const robots = "default" in module ? module.default : undefined;

  expect(robots).toBeTypeOf("function");
  if (typeof robots !== "function") return;

  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nextjs-crm-storefront.vercel.app";
  try {
    expect(robots()).toMatchObject({
      rules: expect.arrayContaining([{ userAgent: "*", allow: "/" }]),
      sitemap: "https://www.htcpro.co.il/sitemap.xml",
      host: "https://www.htcpro.co.il",
    });
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

it("keeps the Google Search Console verification file publicly deployable", async () => {
  const verificationFile = "google738c87d7da2440a3.html";
  const contents = await readFile(join(process.cwd(), "public", verificationFile), "utf8");

  expect(contents.trim()).toBe(`google-site-verification: ${verificationFile}`);
});

it("serves a sitemap containing every catalog product", async () => {
  const module = await import("./sitemap").catch(() => ({}));
  const sitemap = "default" in module ? module.default : undefined;

  expect(sitemap).toBeTypeOf("function");
  if (typeof sitemap !== "function") return;

  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nextjs-crm-storefront.vercel.app";
  let entries: Awaited<ReturnType<typeof sitemap>>;
  try {
    entries = await sitemap();
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
  const urls = entries.map((entry: { url: string }) => entry.url);

  expect(urls).toContain("https://www.htcpro.co.il/shop/at-158");
  expect(urls).toContain("https://www.htcpro.co.il/shop/at-799");
});

it("keeps the public metadata base on htcpro.co.il when Vercel exposes its deployment URL", async () => {
  const { generateMetadata } = await import("./layout");
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nextjs-crm-storefront.vercel.app";
  try {
    const metadata = await generateMetadata();
    expect(metadata.metadataBase?.toString()).toBe("https://www.htcpro.co.il/");
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

it("connects product metadata to the canonical and social SEO builder", async () => {
  const { generateMetadata } = await import("./shop/[handle]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ handle: "at-158" }) });

  expect(metadata.alternates).toEqual({ canonical: "https://www.htcpro.co.il/shop/at-158" });
  expect(metadata.openGraph).toMatchObject({
    url: "https://www.htcpro.co.il/shop/at-158",
    images: [{ url: "https://www.htcpro.co.il/assets/products/at-158-single-v2.webp" }],
  });
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
});

it("keeps cart, checkout and payment result pages out of search results", async () => {
  const [{ metadata: cart }, { metadata: checkout }, { metadata: payment }] = await Promise.all([
    import("./cart/layout").catch(() => ({ metadata: undefined })),
    import("./checkout/layout").catch(() => ({ metadata: undefined })),
    import("./payment/layout").catch(() => ({ metadata: undefined })),
  ]);

  expect(cart?.robots).toEqual({ index: false, follow: false });
  expect(checkout?.robots).toEqual({ index: false, follow: false });
  expect(payment?.robots).toEqual({ index: false, follow: false });
});
