import Icon from "../shared/Icon";

const FAQS = [
  [
    "When does the Abeokuta pilot launch?",
    "It's already live in Abeokuta. We're rolling out to all of Ogun State next — for residents and merchants alike.",
  ],
  [
    "Is it completely free for everyday residents?",
    "Yes, 100% free. Finding cash points, gas refills, food spots, and verified housing will never cost you a kobo.",
  ],
  [
    "How do providers update their status?",
    "Providers update their status directly on their dashboard — one click, instant. No WhatsApp bots, no SMS. Verification is done via email.",
  ],
  [
    "Can I register multiple business locations?",
    "Yes. Register your main branch first, then add additional locations from your dashboard after verification.",
  ],
];

export default function WaitlistFAQ() {
  return (
    <section className="min-w-0 mx-auto w-full max-w-[1240px] px-6 pb-20 lg:px-8">
      <div className="mx-auto mb-10 flex max-w-xl flex-col gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          Questions
        </span>
        <h2 className="font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl">
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