import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import UtilityBar from "../../components/UtilityBar";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { getBlogBySlug, getBlogs } from "../../../lib/blogs";
import { getProducts } from "../../../lib/products";
import { buildBlogMetadata, buildBlogStructuredData, getCanonicalSiteUrl } from "../../../lib/seo-metadata";

type BlogPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBlogs()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return { title: "המאמר לא נמצא | HTC ישראל", robots: { index: false, follow: false } };
  return buildBlogMetadata(post, getCanonicalSiteUrl());
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params;
  const [post, products, allPosts] = await Promise.all([getBlogBySlug(slug), getProducts(), getBlogs()]);
  if (!post) notFound();

  const relatedProducts = products
    .filter((product) => post.relatedProductIds.includes(product.id) || post.relatedProductIds.includes(product.handle))
    .slice(0, 3);
  const relatedPosts = allPosts
    .filter((candidate) => candidate.slug !== post.slug && (post.relatedBlogIds.includes(candidate.id) || candidate.tags.some((tag) => post.tags.includes(tag))))
    .slice(0, 3);
  const structuredData = buildBlogStructuredData(post, getCanonicalSiteUrl());

  return (
    <>
      <UtilityBar />
      <Navbar />
      <main id="main" className="blog-article">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <header className="blog-article__hero">
          <div className="shell blog-article__hero-grid">
            <div className="blog-article__heading">
              <nav className="blog-breadcrumbs" aria-label="פירורי לחם">
                <Link href="/">דף הבית</Link><span>/</span><Link href="/blog">המדריך</Link>
              </nav>
              {post.primaryKeyword && <p className="kicker">{post.primaryKeyword}</p>}
              <h1>{post.title}</h1>
              {post.excerpt && <p className="blog-article__lead">{post.excerpt}</p>}
              <div className="blog-byline">
                <span><b>{post.authorName || "צוות HTC ישראל"}</b>{post.authorRole && ` · ${post.authorRole}`}</span>
                <time dateTime={post.publishedAt || undefined}>{formatDate(post.publishedAt)}</time>
              </div>
            </div>
            <figure className="blog-article__cover">
              {post.featuredImage ? <img src={post.featuredImage} alt={post.title} /> : <span>HTC</span>}
            </figure>
          </div>
        </header>

        <div className="shell blog-article__layout">
          <aside className="blog-article__aside">
            <span>במדריך הזה</span>
            <p>{post.directAnswer || post.excerpt}</p>
            <Link href="/shop">לכל הדגמים <b>←</b></Link>
          </aside>
          <article className="blog-prose" dangerouslySetInnerHTML={{ __html: post.body }} />
        </div>

        {post.faq.length > 0 && (
          <section className="blog-faq">
            <div className="shell blog-faq__grid">
              <div><p className="kicker kicker--dark">שאלות נפוצות</p><h2>תשובות קצרות<br />לפני שבוחרים</h2></div>
              <div>
                {post.faq.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}<span>+</span></summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="blog-related-products">
            <div className="shell">
              <div className="blog-section-heading"><p className="kicker kicker--dark">דגמים מהמדריך</p><h2>המשיכו להשוואה</h2></div>
              <div className="product-grid">
                {relatedProducts.map((product) => <ProductCard key={product.id} product={product} featured={product.handle === "at-799"} />)}
              </div>
            </div>
          </section>
        )}

        {relatedPosts.length > 0 && (
          <section className="blog-related-posts shell">
            <h2>עוד מדריכים שיעזרו לבחור</h2>
            <div>
              {relatedPosts.map((related, index) => (
                <Link href={`/blog/${related.slug}`} key={related.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{related.title}</b>
                  <i>←</i>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="blog-article__cta">
          <div className="shell">
            <p className="kicker">HTC ישראל · יבוא ושיווק</p>
            <h2>צריכים התאמה לבית, למספרה או לעסק?</h2>
            <div><Link className="button button--gold" href="/contact">דברו איתנו</Link><Link className="button button--ghost" href="/shop">לכל הדגמים</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
