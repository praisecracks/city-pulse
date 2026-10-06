import ContactHero from "../components/contact/ContactHero";
import ContactForm from "../components/contact/ContactForm";
import ContactFAQ from "../components/contact/ContactFAQ";
import ContactCTABanner from "../components/contact/ContactCTABanner";

// W5 — Contact Us (PRD Section 6). Route: /contact
export default function Contact() {
  return (
    <>
      <ContactHero />

      <section className="mx-auto w-full max-w-[1240px] px-6 pb-24 lg:px-8">
        <ContactForm />
      </section>

      <ContactFAQ />
      <ContactCTABanner />
    </>
  );
}