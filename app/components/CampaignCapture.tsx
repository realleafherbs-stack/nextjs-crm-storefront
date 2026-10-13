'use client'

import { useEffect } from 'react'
import { collectCampaignParams } from '../../lib/campaign-attribution'

// Remembers utm_* / fbclid from the landing URL for the rest of the tab session,
// so a purchase several pages later can still be attributed to the campaign.
export default function CampaignCapture() {
  useEffect(() => { collectCampaignParams() }, [])
  return null
}
