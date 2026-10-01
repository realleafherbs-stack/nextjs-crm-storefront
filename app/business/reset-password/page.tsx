import { BusinessResetPasswordForm } from '../BusinessLandingClient'
import BusinessPageShell from '../_BusinessPage'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token = '' } = await searchParams; return <BusinessPageShell><BusinessResetPasswordForm token={token} /></BusinessPageShell> }
