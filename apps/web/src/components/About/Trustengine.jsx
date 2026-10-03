import Icon from "../shared/Icon";

const STEPS = [
  [
    "01",
    "Physical Coordinator Onboarding",
    "We do not scrape the web. Local coordinators walk every sector of Abeokuta—from Panseke footpaths to Ibara commercial clusters—to register agents in person, confirming their identity and operating equipment.",
  ],
  [
    "02",
    "Algorithmic Temporal Decay",
    "A listing doesn't stay active just because it was active yesterday morning. If a POS point or gas station has not confirmed status within its designated heartbeat (15 to 60 minutes), the listing dims to a soft amber status before automatically vanishing from the live radar.",
  ],
  [
    "03",
    "Crowd Flagging & Instant Freeze",
    'If two consecutive users mark a listing as "No Cash" or "Pump Dry", the vendor\'s trust score is instantly throttled, triggering an automatic SMS/WhatsApp prompt asking the merchant to confirm or update status before misleading another citizen.',
  ],
];

export default function TrustEngine() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-start justify-between gap-12 lg:flex-row">
        <div className="lg:w-5/12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F0EADB] px-3 py-1 text-xs font-semibold text-[#129E9E]">
            <Icon name="security" size={16} />
            <span>Defensibility</span>
          </div>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            Trust is our entire moat.
          </h2>
          <p className="mt-4 text-base text-[#14232B]/70">
            A platform with 10,000 listings is useless if 3,000 of them are
            closed or fraudulent. We prioritize mathematical certainty and
            strict physical accountability over inflated vanity directories.
          </p>

          <div className="mt-8 flex items-center gap-6 rounded-xl bg-[#F6F1E6] p-6">
            <div className="relative h-20 w-20 shrink-0">
              <svg
                className="h-full w-full -rotate-90 transform"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2DAC5"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#129E9E"
                  strokeDasharray="96, 100"
                  strokeLinecap="round"
                  strokeWidth="3.2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold leading-none text-[#14232B]">
                  96%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-tight text-[#129E9E]">
                  Audit
                </span>
              </div>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[#14232B]">
                Neighborhood Pulse Score
              </span>
              <p className="mt-0.5 text-sm text-[#14232B]/60">
                Based on continuous real-world check-ins, automated ping
                replies, and anonymous crowd confirmations.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-6 lg:w-7/12">
          {STEPS.map(([number, title, text]) => (
            <div
              key={number}
              className="flex items-start gap-5 rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#129E9E]/10 text-lg font-bold text-[#129E9E]">
                {number}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14232B]">{title}</h3>
                <p className="mt-1.5 text-sm text-[#14232B]/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
