import WaitlistHero from "../components/Waitlist/WaitlistHero";
import WaitlistForm from "../components/Waitlist/WaitlistForm";
import WaitlistPerks from "../components/Waitlist/WaitlistPerks";
import WaitlistFAQ from "../components/Waitlist/WaitlistFAQ";

// W1 — Home, waitlist region (PRD Section 6). id="waitlist-section" is the
// scroll target every #waitlist-section link across the site points to —
// keep it on this outer element if you restructure.
export default function WaitlistSection() {
  return (
    <>
      {/* <Navbar /> */}
      <section id="waitlist-section" className="w-full bg-[#F6F1E6]">
        <WaitlistHero />

        <div className="mx-auto w-full max-w-[1240px] px-6 pb-20 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <WaitlistForm />
          </div>
        </div>

        <WaitlistPerks />
        <WaitlistFAQ />
      </section>
    </>
  );
}