import Icon from "../shared/Icon";

const FAQS = [
  [
    "When does the Abeokuta pilot launch?",
    "Initial pilot invitations roll out in Batch 1 for the Panseke and Camp corridors. Registered waitlist members receive early access before the app is publicly indexed on app stores.",
  ],
  [
    "Is it completely free for everyday residents?",
    "Yes, 100% free. Checking cash status, finding cooking gas refill rates, and discovering verified rental properties will never cost residents a kobo.",
  ],
  [
    "How do POS operators and gas depots update their status?",
    "Merchants can broadcast their status in under 5 seconds with a 1-tap WhatsApp prompt, a free SMS reply, or during scheduled daily check-ins by their designated student corridor steward.",
  ],
  [
    "Can I register multiple business kiosks?",
    "Yes. Simply complete the Merchant registration form for your main branch, and specify in the landmark field or during the verification phone call that you operate multiple points across Abeokuta.",
  ],
];

export default function WaitlistFAQ() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 pb-20 lg:px-8">
      <div className="mx-auto mb-10 flex max-w-xl flex-col gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          Clarifications
        </span>
        <h2 className="font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl">
          Pilot Early Access FAQ
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
