import type { MetadataRoute } from "next";
import { getProducts } from "../lib/products";
import { getBlogs } from "../lib/blogs";
import { buildSitemapEntries, getCanonicalSiteUrl } from "../lib/seo-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogPosts] = await Promise.all([getProducts(), getBlogs()]);
  return buildSitemapEntries(products, getCanonicalSiteUrl(), blogPosts);
}
