import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import UtilityBar from "../components/UtilityBar";
import ShopGrid from "./ShopGrid";
import { getProducts, getCategories } from "../../lib/products";
import { getContent, c } from "../../lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const title = c(content, "shop.seo_title", "החנות | HTC ישראל");
  const description = c(content, "shop.seo_description", "חנות HTC ישראל — כל מכונות התספורת, הטרימרים ומכונות הגילוח.");
  const ogImage = content["shop.seo_og_image"];
  return {
    title,
    description,
    ...(ogImage ? { openGraph: { title, description, images: [{ url: ogImage }] } } : {}),
  };
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <UtilityBar />
      <Navbar />
      <main id="main">
        <section className="shop-hero">
          <div className="shell">
            <p className="kicker">HTC · טיפוח מדויק</p>
            <h1>הכלים שעושים<br />את ההבדל.</h1>
            <p>שישה דגמים. מהתספורת הראשונה בבית ועד עבודה מקצועית במספרה.</p>
            <a className="button button--gold" href="#catalog">לבחירת דגם</a>
          </div>
        </section>

        <ShopGrid products={products} categories={categories} />

        <section className="shop-compare">
          <div className="shell">
            <p className="kicker">צריכים עזרה?</p>
            <h2>השוו בין הדגמים ובחרו בביטחון</h2>
            <Link className="button button--gold" href="/compare">להשוואת דגמים</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
