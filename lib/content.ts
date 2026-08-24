const CRM_URL = process.env.CRM_URL!;
const CRM_API_KEY = process.env.CRM_API_KEY!;
const SITE_SLUG = process.env.CRM_SITE_SLUG!;

const headers = { "x-api-key": CRM_API_KEY };

export type ContentMap = Record<string, string>;

function isJson(res: Response) {
  return (res.headers.get("content-type") ?? "").includes("application/json");
}

/** All CRM-editable text fields for this site, keyed by "page.field". */
export async function getContent(): Promise<ContentMap> {
  try {
    const res = await fetch(`${CRM_URL}/api/${SITE_SLUG}/content`, { headers, next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok || !isJson(res)) return {};
    return res.json();
  } catch {
    return {};
  }
}

/** Looks up a key in a ContentMap, falling back to the page's hardcoded default when blank/missing. */
export function c(content: ContentMap, key: string, fallback: string): string {
  const value = content[key];
  return value && value.trim() ? value : fallback;
}
