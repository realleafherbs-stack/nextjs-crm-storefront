import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import UtilityBar from "../../components/UtilityBar";
import ProductDetail from "./ProductDetail";
import { getProducts, getProductByHandle } from "../../../lib/products";
import { productContent, genericProductContent } from "../../../lib/product-content";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  const product = await getProductByHandle(handle);
  if (!product) return {};
  const content = productContent[product.gtin] ?? genericProductContent(product);
  return {
    title: `${product.name} | HTC ישראל`,
    description: content ? `${product.name} — ${content.subtitle}. ${content.description} אחריות ושירות בישראל.` : product.name,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  const [product, allProducts] = await Promise.all([getProductByHandle(handle), getProducts()]);
  if (!product) notFound();
  const content = productContent[product.gtin] ?? genericProductContent(product);
  const related = allProducts.filter((p) => p.handle !== handle).slice(0, 2);

  return (
    <>
      <UtilityBar />
      <Navbar />
      <main className="product-page" id="main">
        <ProductDetail product={product} content={content} related={related} />
      </main>
      <Footer />
    </>
  );
}
