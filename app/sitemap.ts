import type { MetadataRoute } from "next";
import { getProducts } from "../lib/products";
import { buildSitemapEntries, DEFAULT_SITE_URL } from "../lib/seo-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return buildSitemapEntries(products, process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
}
