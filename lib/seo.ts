const CRM_URL = process.env.CRM_URL!;
const CRM_API_KEY = process.env.CRM_API_KEY!;
const SITE_SLUG = process.env.CRM_SITE_SLUG!;

const headers = { "x-api-key": CRM_API_KEY };

export interface SiteSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  schemaLogo: string | null;
  schemaSameAs: string | null;
  organizationName: string | null;
  organizationDescription: string | null;
  defaultAuthorName: string | null;
  defaultAuthorRole: string | null;
  contactUrl: string | null;
  socialProfiles: unknown;
}

export interface PageSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  focusKeyword: string | null;
  indexable: boolean | null;
  directAnswer: string | null;
  heading: string | null;
  summary: string | null;
  schemaType: string | null;
}

function isJson(res: Response) {
  return (res.headers.get("content-type") ?? "").includes("application/json");
}

export async function getSiteSeo(): Promise<Partial<SiteSeo>> {
  try {
    const res = await fetch(`${CRM_URL}/api/${SITE_SLUG}/seo`, { headers, next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok || !isJson(res)) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function getPageSeo(page: string): Promise<Partial<PageSeo>> {
  try {
    const res = await fetch(`${CRM_URL}/api/${SITE_SLUG}/seo/pages/${encodeURIComponent(page)}`, { headers, next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok || !isJson(res)) return {};
    return res.json();
  } catch {
    return {};
  }
}
