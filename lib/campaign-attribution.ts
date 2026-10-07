export const CAMPAIGN_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const

export type CampaignParams = Partial<Record<(typeof CAMPAIGN_PARAM_KEYS)[number], string>>

const STORAGE_KEY = 'htc-business-campaign-v1'
const MAX_VALUE_LENGTH = 500

// Used on both sides: the browser trims what it sends, and the API route never
// trusts it and re-applies the same allowlist before forwarding to the CRM.
export function sanitizeCampaignParams(value: unknown): CampaignParams {
  const result: CampaignParams = {}
  if (!value || typeof value !== 'object') return result
  const source = value as Record<string, unknown>
  for (const key of CAMPAIGN_PARAM_KEYS) {
    const entry = source[key]
    if (typeof entry !== 'string') continue
    const trimmed = entry.trim()
    if (trimmed && trimmed.length <= MAX_VALUE_LENGTH) result[key] = trimmed
  }
  return result
}

// Campaign links land on /business but the form lives on /business/apply, so
// the parameters are held for the tab session. A new campaign URL replaces them.
export function collectCampaignParams(): CampaignParams {
  try {
    const query = new URLSearchParams(window.location.search)
    const fromUrl = sanitizeCampaignParams(Object.fromEntries(CAMPAIGN_PARAM_KEYS.map((key) => [key, query.get(key)])))
    if (Object.keys(fromUrl).length > 0) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl))
      return fromUrl
    }
    return sanitizeCampaignParams(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return {}
  }
}
