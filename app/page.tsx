import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import UtilityBar from "./components/UtilityBar";
import ProductCard from "./components/ProductCard";
import { getProducts } from "../lib/products";

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.find((p) => p.handle === "at-799") ?? products[0];

  return (
    <>
      <UtilityBar />
      <Navbar />
      <main id="main">
        <section className="hero">
          <div className="hero__texture"></div>
          <div className="shell hero__grid">
            <div className="hero__copy">
              <p className="kicker">HTC</p>
              <h1>מכונות תספורת וגילוח<br /><em>שנבנו לביצועים</em></h1>
              <p className="hero__lead"><strong>תוצאה חדה ומדויקת.</strong><br />ביצועים מקצועיים עם אחריות בישראל.</p>
              <div className="hero__actions">
                <a className="button button--gold" href="#products">לכל הדגמים <span>←</span></a>
                <Link className="button button--ghost" href="/compare">השוואת דגמים</Link>
              </div>
            </div>
            <div className="hero__visual" role="img" aria-label="מכונת תספורת מקצועית HTC בסביבת ברברשופ"></div>
          </div>
        </section>

        <section className="benefits" id="benefits" aria-label="יתרונות מוצר">
          <div className="shell benefits__grid">
            <article><span>01</span><svg aria-hidden="true"><use href="#icon-blade"/></svg><div><h3>להבים איכותיים</h3><p>חיתוך חד ומדויק בכל פעם</p></div></article>
            <article><span>02</span><svg aria-hidden="true"><use href="#icon-grip"/></svg><div><h3>אחיזה נוחה</h3><p>שליטה מלאה ובטוחה</p></div></article>
            <article><span>03</span><svg aria-hidden="true"><use href="#icon-battery"/></svg><div><h3>זמן עבודה ממושך</h3><p>פחות טעינות, יותר שימוש</p></div></article>
            <article><span>04</span><svg aria-hidden="true"><use href="#icon-motor"/></svg><div><h3>מנוע עוצמתי</h3><p>עבודה חלקה ללא מאמץ</p></div></article>
            <article><span>05</span><svg aria-hidden="true"><use href="#icon-shield"/></svg><div><h3>אחריות יבואן רשמי</h3><p>שירות ותמיכה בישראל</p></div></article>
          </div>
        </section>

        <section className="global-band" id="about">
          <div className="shell global-band__grid">
            <div className="global-band__map">
              <img src="/assets-htc-global.jpg" loading="lazy" decoding="async" alt="HTC מותג בינלאומי — מפת פעילות עולמית" />
            </div>
            <div className="global-band__copy">
              <p className="kicker">מותג בינלאומי. עכשיו גם בישראל.</p>
              <h2>HTC</h2>
              <p>מכונות תספורת וגילוח לשימוש ביתי ומקצועי — עם ביצועים אמינים ושירות מקומי.</p>
              <a href="#products">לצפייה בדגמים</a>
            </div>
          </div>
        </section>

        <section className="products section" id="products">
          <div className="shell">
            <div className="section-heading section-heading--center">
              <div><h2>בחרו את הדגם שמתאים לכם</h2><p><b>{products.length} דגמים.</b> פתרון לכל צורך.</p><i></i></div>
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} featured={product.handle === "at-799"} />
              ))}
            </div>
          </div>
        </section>

        {featured && (
          <section className="brand-story section" id="one-pro">
            <div className="shell brand-story__grid">
              <div className="brand-story__image brand-story__product">
                <img src="/assets/higgs/at-799-angle.jpg" loading="lazy" decoding="async" alt="HTC One Pro בזווית מוצר מקצועית" />
                <span>ONE PRO<br />PROFESSIONAL</span>
              </div>
              <div className="brand-story__copy">
                <p className="kicker">נבנתה למקצוענים</p>
                <h2 className="one-pro__title"><span dir="ltr">HTC ONE PRO</span><span>דיוק בלי פשרות</span></h2>
                <p>מנוע ללא פחמים ולהב DLC לחיתוך חלק, מדויק ורציף.</p>
                <div className="one-pro__specs">
                  <span><b>עד 360 דקות</b><small>זמן עבודה</small></span>
                  <span><b>DLC</b><small>להב קבוע מצופה</small></span>
                  <span><b>9,000 סל״ד</b><small>עוצמה יציבה</small></span>
                  <span><b>3,000mAh</b><small>קיבולת סוללה</small></span>
                </div>
                <div className="hero__actions">
                  <Link className="button button--gold" href={`/shop/${featured.handle}`}>לרכישה</Link>
                  <Link className="button button--ghost" href="/compare">השוו דגמים</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="why section" id="compare">
          <div className="shell">
            <div className="why__heading"><h2>למה HTC?</h2><p>ביצועים מקצועיים. שירות מקומי.</p></div>
            <div className="why__grid">
              <article><b>01</b><h3>טכנולוגיה מתקדמת</h3><p>מנועים ולהבים לביצועים יציבים.</p></article>
              <article><b>02</b><h3>עמידות גבוהה</h3><p>חומרים איכותיים לשימוש ממושך.</p></article>
              <article><b>03</b><h3>דיוק מקסימלי</h3><p>שליטה מדויקת בכל אורך חיתוך.</p></article>
              <article><b>04</b><h3>שירות בישראל</h3><p>אחריות ותמיכה מקומית.</p></article>
            </div>
          </div>
        </section>

        <section className="service section" id="service">
          <div className="shell service__split">
            <div className="service__copy">
              <p className="kicker">לספרים ומספרות</p>
              <h2>עובדים עם HTC</h2>
              <p>כלים מקצועיים ושירות בישראל.</p>
              <Link className="button button--gold" href="/contact">דברו איתנו</Link>
            </div>
            <div className="service__photo">
              <img src="/service-barbershop.jpg" loading="lazy" decoding="async" alt="עמדת ברברשופ מקצועית עם מגוון מכונות HTC" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
