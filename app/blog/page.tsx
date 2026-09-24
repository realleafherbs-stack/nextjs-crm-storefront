import type { Metadata } from "next";
import Link from "next/link";
import UtilityBar from "../components/UtilityBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getBlogs } from "../../lib/blogs";
import { buildBlogIndexStructuredData, getCanonicalSiteUrl } from "../../lib/seo-metadata";

export const metadata: Metadata = {
  title: "מדריכים למכונות תספורת וטיפוח | HTC ישראל",
  description: "מדריכי HTC ישראל לבחירת מכונות תספורת, טרימרים ומכונות גילוח לבית, למספרה ולרכישה עסקית.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "HTC ישראל",
    title: "המדריך של HTC ישראל",
    description: "בחירה נכונה, עבודה מקצועית וטיפוח מדויק — מידע שימושי לפני שקונים.",
    url: "/blog",
    images: [{ url: "/service-barbershop.jpg", alt: "מדריכים מקצועיים למכונות תספורת HTC" }],
  },
};

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = (await getBlogs()).filter((post) => post.indexable !== false);
  const [featured, ...morePosts] = posts;
  const structuredData = buildBlogIndexStructuredData(posts, getCanonicalSiteUrl());

  return (
    <>
      <UtilityBar />
      <Navbar />
      <main id="main" className="blog-index">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <header className="blog-index__hero">
          <div className="shell">
            <p className="kicker">HTC JOURNAL · ידע מקצועי</p>
            <h1>לבחור נכון.<br /><em>לעבוד מדויק.</em></h1>
            <p>מדריכים קצרים ומעשיים למכונות תספורת, טרימרים וגילוח — לבית, למספרה ולעסק.</p>
          </div>
        </header>

        {featured ? (
          <section className="blog-index__content shell" aria-label="מאמרים אחרונים">
            <article className="blog-featured">
              <Link className="blog-featured__media" href={`/blog/${featured.slug}`} aria-label={`לקריאת ${featured.title}`}>
                {featured.featuredImage ? <img src={featured.featuredImage} alt={featured.title} /> : <span>HTC</span>}
              </Link>
              <div className="blog-featured__copy">
                <p className="blog-meta"><span>01</span>{formatDate(featured.publishedAt)}</p>
                <h2><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2>
                <p>{featured.excerpt || featured.metaDescription}</p>
                <Link className="blog-read-link" href={`/blog/${featured.slug}`}>לקריאת המדריך <span>←</span></Link>
              </div>
            </article>

            {morePosts.length > 0 && (
              <div className="blog-grid">
                {morePosts.map((post, index) => (
                  <article className="blog-card" key={post.id}>
                    <Link className="blog-card__media" href={`/blog/${post.slug}`} aria-label={`לקריאת ${post.title}`}>
                      {post.featuredImage ? <img src={post.featuredImage} loading="lazy" decoding="async" alt={post.title} /> : <span>HTC</span>}
                    </Link>
                    <div className="blog-card__copy">
                      <p className="blog-meta"><span>{String(index + 2).padStart(2, "0")}</span>{formatDate(post.publishedAt)}</p>
                      <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                      <p>{post.excerpt || post.metaDescription}</p>
                      <Link className="blog-read-link" href={`/blog/${post.slug}`}>לקריאה <span>←</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="blog-empty shell">
            <p className="kicker kicker--dark">בקרוב</p>
            <h2>המדריכים המקצועיים שלנו בדרך.</h2>
            <Link className="button button--gold" href="/shop">לכל הדגמים</Link>
          </section>
        )}

        <section className="blog-business">
          <div className="shell">
            <div>
              <p className="kicker">למספרות, חנויות ושותפים עסקיים</p>
              <h2>מחפשים מכונות תספורת בסיטונאות?</h2>
            </div>
            <p>דברו איתנו על דגמי HTC, זמינות והתאמה לעסק שלכם.</p>
            <Link className="button button--gold" href="/contact">ליצירת קשר עסקי</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
