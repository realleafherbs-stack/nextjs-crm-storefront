import { useCallback, useEffect, useState } from 'react'

export type BusinessCartLine = { productId: string; quantity: number }

type BusinessCatalogTerm = {
  productId: string
  stock: number | null
  minQuantity: number
  quantityIncrement: number
  maxQuantity: number | null
}

export const BUSINESS_CART_STORAGE_KEY = 'htc-israel-b2b-cart-v1'
export const BUSINESS_CART_UPDATED_EVENT = 'htc-israel-b2b-cart-updated'

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

function validLine(value: unknown): BusinessCartLine | null {
  if (!value || typeof value !== 'object') return null
  const line = value as Record<string, unknown>
  if (typeof line.productId !== 'string' || !line.productId.trim() || line.productId.length > 190) return null
  if (typeof line.quantity !== 'number' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10_000) return null
  return { productId: line.productId, quantity: line.quantity }
}

export function sanitizeBusinessCart(value: unknown): BusinessCartLine[] {
  if (!Array.isArray(value)) return []
  const byProduct = new Map<string, number>()
  for (const candidate of value) {
    const line = validLine(candidate)
    if (!line) continue
    byProduct.set(line.productId, Math.min(10_000, (byProduct.get(line.productId) ?? 0) + line.quantity))
  }
  return [...byProduct].map(([productId, quantity]) => ({ productId, quantity }))
}

export function readBusinessCart(): BusinessCartLine[] {
  const saved = storage()?.getItem(BUSINESS_CART_STORAGE_KEY)
  if (!saved) return []
  try { return sanitizeBusinessCart(JSON.parse(saved)) } catch { return [] }
}

export function writeBusinessCart(lines: BusinessCartLine[]) {
  const target = storage()
  if (!target) return
  const sanitized = sanitizeBusinessCart(lines)
  target.setItem(BUSINESS_CART_STORAGE_KEY, JSON.stringify(sanitized))
  window.dispatchEvent(new CustomEvent(BUSINESS_CART_UPDATED_EVENT))
}

export function addBusinessLine(line: BusinessCartLine) {
  const next = sanitizeBusinessCart([...readBusinessCart(), line])
  writeBusinessCart(next)
  return next
}

export function updateBusinessLine(productId: string, quantity: number) {
  const next = sanitizeBusinessCart(readBusinessCart().map((line) => line.productId === productId ? { productId, quantity } : line))
  writeBusinessCart(next)
  return next
}

export function removeBusinessLine(productId: string) {
  const next = readBusinessCart().filter((line) => line.productId !== productId)
  writeBusinessCart(next)
  return next
}

function maxPermittedQuantity(term: BusinessCatalogTerm) {
  const stockCap = term.stock === null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(term.stock))
  const termCap = term.maxQuantity === null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(term.maxQuantity))
  return Math.min(stockCap, termCap)
}

function normalizeQuantity(quantity: number, term: BusinessCatalogTerm): number | null {
  const min = Math.max(1, Math.floor(term.minQuantity))
  const increment = Math.max(1, Math.floor(term.quantityIncrement))
  const cap = maxPermittedQuantity(term)
  if (cap < min) return null
  const proposed = Math.max(min, Math.min(Math.floor(quantity), cap))
  const normalized = min + Math.floor((proposed - min) / increment) * increment
  return normalized >= min ? normalized : null
}

export function reconcileBusinessCart(lines: BusinessCartLine[], terms: BusinessCatalogTerm[]) {
  const byProduct = new Map(terms.map((term) => [term.productId, term]))
  const kept: BusinessCartLine[] = []
  const removedProductIds: string[] = []
  for (const line of sanitizeBusinessCart(lines)) {
    const term = byProduct.get(line.productId)
    const quantity = term ? normalizeQuantity(line.quantity, term) : null
    if (quantity === null) removedProductIds.push(line.productId)
    else kept.push({ productId: line.productId, quantity })
  }
  return { lines: kept, removedProductIds }
}

export function useBusinessCart() {
  const [lines, setLines] = useState<BusinessCartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setLines(readBusinessCart())
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key === BUSINESS_CART_STORAGE_KEY) sync()
    }
    sync()
    setReady(true)
    window.addEventListener(BUSINESS_CART_UPDATED_EVENT, sync)
    window.addEventListener('storage', syncFromOtherTab)
    return () => {
      window.removeEventListener(BUSINESS_CART_UPDATED_EVENT, sync)
      window.removeEventListener('storage', syncFromOtherTab)
    }
  }, [])

  const persist = useCallback((next: BusinessCartLine[]) => {
    const sanitized = sanitizeBusinessCart(next)
    writeBusinessCart(sanitized)
    setLines(sanitized)
  }, [])

  const addLine = useCallback((line: BusinessCartLine) => {
    setLines((current) => {
      const next = sanitizeBusinessCart([...current, line])
      writeBusinessCart(next)
      return next
    })
  }, [])

  const updateLine = useCallback((productId: string, quantity: number) => {
    setLines((current) => {
      const next = sanitizeBusinessCart(current.map((line) => line.productId === productId ? { productId, quantity } : line))
      writeBusinessCart(next)
      return next
    })
  }, [])

  const removeLine = useCallback((productId: string) => {
    setLines((current) => {
      const next = current.filter((line) => line.productId !== productId)
      writeBusinessCart(next)
      return next
    })
  }, [])

  return { lines, ready, addLine, updateLine, removeLine, replaceLines: persist }
}
