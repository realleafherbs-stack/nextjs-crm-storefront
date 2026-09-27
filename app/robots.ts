import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "../lib/seo-metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();
  const protectedBusinessPaths = ["/business/account", "/business/catalog", "/business/cart", "/business/checkout"];
  const crawlers = ["*", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];

  return {
    rules: crawlers.map((userAgent) => ({ userAgent, allow: "/", disallow: protectedBusinessPaths })),
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
