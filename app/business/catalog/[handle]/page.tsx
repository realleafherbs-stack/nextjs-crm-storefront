import BusinessPageShell from '../../_BusinessPage'
import BusinessProductDetailClient from './BusinessProductDetailClient'

export default async function BusinessProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params
  return <BusinessPageShell><BusinessProductDetailClient handle={decodeURIComponent(rawHandle)} /></BusinessPageShell>
}
