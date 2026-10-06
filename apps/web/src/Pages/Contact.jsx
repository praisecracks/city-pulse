import ContactHero from "../components/Contact/ContactHero";
import ContactForm from "../components/Contact/ContactForm";
import ContactFAQ from "../components/Contact/ContactFAQ";
import ContactCTABanner from "../components/Contact/ContactCTABanner";

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