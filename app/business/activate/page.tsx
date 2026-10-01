import { BusinessActivationForm } from '../BusinessLandingClient'
import BusinessPageShell from '../_BusinessPage'

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token = '' } = await searchParams; return <BusinessPageShell><BusinessActivationForm token={token} /></BusinessPageShell> }
