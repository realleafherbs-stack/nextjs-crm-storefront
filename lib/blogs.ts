const CRM_URL = process.env.CRM_URL;
const SITE_SLUG = process.env.CRM_SITE_SLUG;
const CRM_API_KEY = process.env.CRM_API_KEY;

async function fallbackPosts() {
  const { fallbackBlogPosts } = await import("./blog-content");
  return fallbackBlogPosts;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  status?: "DRAFT" | "PUBLISHED";
  excerpt?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  tags: string[];
  primaryKeyword?: string | null;
  canonicalUrl?: string | null;
  indexable?: boolean | null;
  directAnswer?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  reviewedBy?: string | null;
  contentType?: string | null;
  faq: BlogFaq[];
  relatedProductIds: string[];
  relatedBlogIds: string[];
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function mergeBlogPosts(crmPosts: BlogPost[], builtInPosts: BlogPost[]): BlogPost[] {
  const crmSlugs = new Set(crmPosts.map((post) => post.slug));
  return [...crmPosts, ...builtInPosts.filter((post) => !crmSlugs.has(post.slug))]
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
}

type BlogSummary = Pick<BlogPost, "id" | "title" | "slug" | "publishedAt" | "featuredImage" | "metaTitle" | "metaDescription" | "ogImage" | "tags">;

function crmHeaders(): HeadersInit {
  return CRM_API_KEY ? { "x-api-key": CRM_API_KEY } : {};
}

function normalizeFaq(value: unknown): BlogFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = "question" in item && typeof item.question === "string" ? item.question.trim() : "";
    const answer = "answer" in item && typeof item.answer === "string" ? item.answer.trim() : "";
    return question && answer ? [{ question, answer }] : [];
  });
}

function normalizeStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function normalizeBlog(value: Record<string, unknown>): BlogPost | null {
  if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.slug !== "string") return null;
  return {
    id: value.id,
    title: value.title,
    slug: value.slug,
    body: typeof value.body === "string" ? value.body : "",
    status: value.status === "DRAFT" || value.status === "PUBLISHED" ? value.status : undefined,
    excerpt: typeof value.excerpt === "string" ? value.excerpt : null,
    featuredImage: typeof value.featuredImage === "string" ? value.featuredImage : null,
    metaTitle: typeof value.metaTitle === "string" ? value.metaTitle : null,
    metaDescription: typeof value.metaDescription === "string" ? value.metaDescription : null,
    ogImage: typeof value.ogImage === "string" ? value.ogImage : null,
    tags: normalizeStrings(value.tags),
    primaryKeyword: typeof value.primaryKeyword === "string" ? value.primaryKeyword : null,
    canonicalUrl: typeof value.canonicalUrl === "string" ? value.canonicalUrl : null,
    indexable: typeof value.indexable === "boolean" ? value.indexable : true,
    directAnswer: typeof value.directAnswer === "string" ? value.directAnswer : null,
    authorName: typeof value.authorName === "string" ? value.authorName : null,
    authorRole: typeof value.authorRole === "string" ? value.authorRole : null,
    reviewedBy: typeof value.reviewedBy === "string" ? value.reviewedBy : null,
    contentType: typeof value.contentType === "string" ? value.contentType : null,
    faq: normalizeFaq(value.faq),
    relatedProductIds: normalizeStrings(value.relatedProductIds),
    relatedBlogIds: normalizeStrings(value.relatedBlogIds),
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  if (!CRM_URL || !SITE_SLUG || !CRM_API_KEY) return null;
  const response = await fetch(`${CRM_URL}/api/${SITE_SLUG}/blogs/${encodeURIComponent(slug)}`, {
    headers: crmHeaders(),
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const value = await response.json();
  return value && typeof value === "object" ? normalizeBlog(value as Record<string, unknown>) : null;
}

export async function getBlogs(): Promise<BlogPost[]> {
  if (!CRM_URL || !SITE_SLUG || !CRM_API_KEY) return fallbackPosts();
  try {
    const response = await fetch(`${CRM_URL}/api/${SITE_SLUG}/blogs`, {
      headers: crmHeaders(),
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fallbackPosts();
    const summaries: BlogSummary[] = await response.json();
    if (!Array.isArray(summaries) || summaries.length === 0) return fallbackPosts();

    const posts = await Promise.all(summaries.map((summary) => fetchBlogBySlug(summary.slug)));
    const publishedPosts = posts.filter((post): post is BlogPost => Boolean(post));
    return mergeBlogPosts(publishedPosts, await fallbackPosts());
  } catch {
    return fallbackPosts();
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await fetchBlogBySlug(slug);
    if (post) return post;
  } catch {
    // Fall through to the built-in editorial content when the CRM is unavailable.
  }
  return (await fallbackPosts()).find((post) => post.slug === slug) ?? null;
}
