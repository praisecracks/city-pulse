import Icon from "../shared/Icon";
import { CONTACT } from "../../data/contact";

const FAQS = [
  [
    "How long does merchant verification take in Abeokuta?",
    "Usually under 12 hours. A physical Field Steward visits your kiosk or depot in Panseke, Ibara, Camp, or Kuto to calibrate your GPS beacon, confirm real-time cash or gas refills, and attach your verified green check badge.",
  ],
  [
    "Do you charge fees to list on City Pulse?",
    "Zero fees. Listing on City Pulse is 100% free for small POS operators, mama-put street stalls, and neighbourhood cooking gas points throughout our entire Ogun State pilot rollout phase. We exist to make utility frictionless.",
  ],
  [
    "Can journalists and tech writers test the mobile app before public launch?",
    <>
      Yes. Send an email to <strong className="font-semibold text-[#129E9E]">{CONTACT.emails.press}</strong> referencing your publication, and our media desk will send immediate access to our iOS TestFlight build and Android verified release APK.
    </>,
  ],
  [
    "When is City Pulse expanding outside Abeokuta?",
    "Ibadan (Bodija, UI, Ring Road) and peri-urban Lagos corridors (Ikorodu, Alimosho) are scheduled for Phase 3 rollout. If you are a municipal cluster partner or trade union in those cities, contact our partnerships desk today.",
  ],
];

export default function ContactFAQ() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 py-24 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F0EADB] px-3 py-1 text-xs font-semibold text-[#129E9E]">
            <Icon name="help_center" size={16} />
            <span>Fast Clarifications</span>
          </div>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            Frequently asked before reaching out.
          </h2>
          <p className="text-base text-[#14232B]/70">
            Quick clarity on merchant listings, pilot scopes, and media inquiries in Ogun State.
          </p>
          <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#F6F1E6] p-5 shadow-sm">
            <span className="text-lg font-bold text-[#14232B]">Still have a custom case?</span>
            <p className="text-sm text-[#14232B]/60">
              Our team reads and reviews all inquiries directly each morning at 8:00 AM WAT.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-8">
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group cursor-pointer rounded-xl bg-white p-6 shadow-sm">
              <summary className="flex list-none items-center justify-between gap-4 text-lg font-bold text-[#14232B] [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <Icon
                  name="expand_more"
                  size={24}
                  className="shrink-0 text-[#129E9E] transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="mt-4 border-t border-[#14232B]/10 pt-4 text-base leading-relaxed text-[#14232B]/70">
                {answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
