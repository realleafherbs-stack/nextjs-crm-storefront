import { NextRequest, NextResponse } from 'next/server'
import { businessCrm } from '../../../../lib/business-crm'
import { sanitizeCampaignParams } from '../../../../lib/campaign-attribution'
import { buildFbc, sendMetaCapiEvent } from '../../../../lib/metaCapi'
import { businessRouteError } from '../_shared'

// TEMPORARY: Meta Test Events code for verifying the server CompleteRegistration
// event. Events sent with it do not count for measurement, so this must be
// removed as soon as the test is done.
const TEMP_TEST_EVENT_CODE = 'TEST42509'

const businessTypes = new Set(['SALON', 'BARBER', 'RETAILER', 'DISTRIBUTOR', 'OTHER'])

function readString(value: unknown, required = false): string | undefined {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string' || !value.trim() || value.length > 500) return undefined
  return value.trim()
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'פרטי העסק אינם תקינים' }, { status: 400 })
  const value = body as Record<string, unknown>
  const businessName = readString(value.businessName, true)
  const contactName = readString(value.contactName, true)
  const email = readString(value.email, true)
  const phone = readString(value.phone, true)
  const city = readString(value.city, true)
  const businessIdentifier = readString(value.businessIdentifier, true)
  const businessType = typeof value.businessType === 'string' && businessTypes.has(value.businessType) ? value.businessType : undefined
  if (!businessName || !contactName || !email || !phone || !city || !businessIdentifier || !businessType) {
    return NextResponse.json({ error: 'יש למלא את כל פרטי העסק הנדרשים' }, { status: 400 })
  }
  const attribution = sanitizeCampaignParams(value.attribution)
  try {
    const result = await businessCrm.apply({
      businessName,
      contactName,
      email,
      phone,
      city,
      businessType,
      businessIdentifier,
      website: readString(value.website),
      notes: readString(value.notes),
      source: 'htc-business-site',
      ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
    })
    const applicationId = String(result.applicationId)
    // The saved application is the conversion. sendMetaCapiEvent never throws, and
    // event_id equals the lead_id the browser pushes so Meta can deduplicate the two.
    await sendMetaCapiEvent({
      event: 'CompleteRegistration',
      eventId: applicationId,
      email,
      phone,
      fbp: request.cookies.get('_fbp')?.value,
      fbc: request.cookies.get('_fbc')?.value ?? (attribution.fbclid ? buildFbc(attribution.fbclid) : undefined),
      clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') ?? undefined,
      eventSourceUrl: request.headers.get('referer') ?? undefined,
      testEventCode: TEMP_TEST_EVENT_CODE,
    })
    return NextResponse.json({ ok: true, applicationId })
  } catch (error) {
    return businessRouteError(error)
  }
}
