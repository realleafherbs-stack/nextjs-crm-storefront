import { describe, expect, it } from 'vitest'
import { getProductManual } from './product-manuals'

describe('getProductManual', () => {
  it('maps every supplied HTC mobile manual to its matching product handle', () => {
    expect(getProductManual('at-158')?.href).toBe('/manuals/htc-at-158-he.pdf')
    expect(getProductManual('at-570')?.href).toBe('/manuals/htc-at-570-he.pdf')
    expect(getProductManual('at-599')?.href).toBe('/manuals/htc-at-599-he.pdf')
    expect(getProductManual('at-735')?.href).toBe('/manuals/htc-at-735-he.pdf')
    expect(getProductManual('at-799')?.href).toBe('/manuals/htc-at-799-he.pdf')
    expect(getProductManual('gt-667')?.href).toBe('/manuals/htc-gt-667-he.pdf')
  })
})
