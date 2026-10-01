export type ProductManual = {
  href: string
}

const manualsByHandle: Record<string, ProductManual> = {
  'at-570': { href: '/manuals/htc-at-570-he.pdf' },
  'at-735': { href: '/manuals/htc-at-735-he.pdf' },
  'at-158': { href: '/manuals/htc-at-158-he.pdf' },
  'at-799': { href: '/manuals/htc-at-799-he.pdf' },
  'gt-667': { href: '/manuals/htc-gt-667-he.pdf' },
}

export function getProductManual(handle: string): ProductManual | null {
  return manualsByHandle[handle] ?? null
}
