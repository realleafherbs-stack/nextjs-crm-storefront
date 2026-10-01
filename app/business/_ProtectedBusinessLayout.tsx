import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const privateBusinessMetadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ProtectedBusinessLayout({ children }: { children: ReactNode }) {
  return children
}
