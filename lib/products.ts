import { products as fallbackProducts, type StoreProduct } from "./products-data";
import { categories as fallbackCategories, type Category } from "./categories";

const CRM_URL = process.env.CRM_URL!;
const SITE_SLUG = process.env.CRM_SITE_SLUG!;

interface CrmProduct {
  id: string;
  handle: string;
  name: string;
  price: number;
  badge?: string | null;
  image?: string | null;
  images?: string[];
  cardFeatures?: string[];
  category?: { id: string; name: string; slug: string } | null;
  categoryOrder?: number;
  gtin?: string | null;
  payperSku?: string | null;
  stockQuantity?: number | null;
}

// A product Payper doesn't actively track has no stockQuantity at all — treat
// a genuinely missing count as available rather than showing it as sold out.
// Mirrors nic-pouch-store-main's lib/catalog/crm-adapter.mjs exactly.
function resolveStock(stockQuantity: number | null | undefined): number {
  if (stockQuantity == null) return 999;
  return Math.max(0, Math.trunc(stockQuantity));
}

export async function getProducts(): Promise<StoreProduct[]> {
  try {
    const res = await fetch(`${CRM_URL}/api/${SITE_SLUG}/products`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallbackProducts;
    const data: CrmProduct[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return fallbackProducts;
    return data.map((p) => ({
      // id is the CRM's database cuid (internal only); handle is the human-readable SKU — never use id as a display SKU.
      id: p.id,
      handle: p.handle,
      name: p.name,
      price: p.price,
      badge: p.badge ?? undefined,
      image: p.image ?? p.images?.[0] ?? "",
      images: p.images ?? (p.image ? [p.image] : []),
      cardFeatures: p.cardFeatures ?? [],
      category: p.category ?? fallbackCategories[0],
      categoryOrder: p.categoryOrder ?? 0,
      // gtin doubles as the key into lib/product-content.ts's local editorial
      // data — CRM never sets gtin for Payper-synced products, only
      // payperSku (same barcode number), so fall back to that.
      gtin: p.gtin ?? p.payperSku ?? "",
      stock: resolveStock(p.stockQuantity),
    }));
  } catch {
    return fallbackProducts;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${CRM_URL}/api/${SITE_SLUG}/categories`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallbackCategories;
    const data: Category[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return fallbackCategories;
    return data;
  } catch {
    return fallbackCategories;
  }
}

export async function getProductByHandle(handle: string): Promise<StoreProduct | undefined> {
  const products = await getProducts();
  return products.find((p) => p.handle === handle);
}
