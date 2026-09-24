import type { MetadataRoute } from "next";
import { getProducts } from "../lib/products";
import { buildSitemapEntries, getCanonicalSiteUrl } from "../lib/seo-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return buildSitemapEntries(products, getCanonicalSiteUrl());
}
