import Icon from "../shared/Icon";

const FAQS = [
  [
    "How long does merchant verification take in Abeokuta?",
    "Verification is immediate when a City Pulse team member onboards you in person. If you register on your own, verification takes up to 12 hours.",
  ],
  [
    "Do you charge to list on City Pulse?",
    "No. Listing is completely free for all service providers throughout our pilot phase in Abeokuta.",
  ],
  [
    "Can journalists or tech writers test the mobile app before public launch?",
    "Yes. Email citypulse@gmail.com with your publication and what you need, and we'll share access and assets.",
  ],
  [
    "When is City Pulse expanding outside of Abeokuta?",
    "Expansion is not yet scheduled. We're currently building ground-truth coverage across Abeokuta and Ogun State. Soon we'll extend beyond into other states.",
  ],
];

export default function ContactFAQ() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 py-24 lg:px-8">
      <div className="mx-auto mb-10 flex max-w-xl flex-col gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          Questions
        </span>
        <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {FAQS.map(([q, a]) => (
          <details
            key={q}
            className="group cursor-pointer rounded-2xl bg-white p-5 shadow-sm"
          >
            <summary className="flex list-none items-center justify-between text-base font-bold text-[#14232B] [&::-webkit-details-marker]:hidden">
              <span>{q}</span>
              <Icon
                name="expand_more"
                size={22}
                className="shrink-0 text-[#14232B]/40 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pt-3 text-base text-[#14232B]/70">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
