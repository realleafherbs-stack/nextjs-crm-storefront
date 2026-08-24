import type { Metadata } from "next";
import InnerHeader from "../components/InnerHeader";
import InnerFooter from "../components/InnerFooter";
import ContactForm from "./ContactForm";
import { WhatsAppContactLink } from "../components/WhatsAppButton";
import { getContent, c } from "../../lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const title = c(content, "contact.seo_title", "יצירת קשר | HTC ישראל");
  const description = c(content, "contact.seo_description", "יצירת קשר עם HTC ישראל לייעוץ לפני רכישה, שירות, אחריות ומשלוחים.");
  const ogImage = content["contact.seo_og_image"];
  return {
    title,
    description,
    ...(ogImage ? { openGraph: { title, description, images: [{ url: ogImage }] } } : {}),
  };
}

export default async function ContactPage() {
  const content = await getContent();
  return (
    <>
      <InnerHeader />
      <section className="inner-hero inner-hero--contact">
        <div className="shell">
          <p>HTC ISRAEL</p>
          <h1>{c(content, "contact.hero_heading", "דברו איתנו")}</h1>
          <span>{c(content, "contact.hero_subheading", "רכישה, שירות ואחריות")}</span>
        </div>
      </section>
      <main className="contact-page shell" id="main">
        <div className="contact-intro">
          <p className="kicker kicker--dark">שירות בישראל</p>
          <h2>איך אפשר לעזור?</h2>
          <p>השאירו פרטים. לפנייה על הזמנה, ציינו דגם ומספר הזמנה.</p>
          <div className="contact-details">
            <WhatsAppContactLink />
            <a href="mailto:service@htc-israel.co.il"><b>אימייל</b><span>service@htc-israel.co.il</span></a>
            <div><b>שעות פעילות</b><span>א׳–ה׳ 09:00–17:00</span></div>
          </div>
        </div>
        <ContactForm />
      </main>
      <section className="contact-trust">
        <div className="shell">
          <span><b>♢</b>אחריות בישראל</span>
          <span><b>▰</b>משלוח מהיר</span>
          <span><b>◉</b>שירות אנושי</span>
        </div>
      </section>
      <InnerFooter />
    </>
  );
}
