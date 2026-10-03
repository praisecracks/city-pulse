import Icon from "../shared/Icon";

const TICKER = [
  {
    icon: "trip_origin",
    label: "Panseke Corridor:",
    value: "Queue Open (Batch 1)",
  },
  { icon: "hourglass_top", label: "Camp / FUNAAB:", value: "84% Allocated" },
  {
    icon: "bolt",
    label: "Omida & Kuto:",
    value: "Registering Now",
    muted: true,
  },
];

export default function WaitlistHero() {
  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-6 pb-12 pt-10 lg:px-8 lg:pt-14">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-[#129E9E]/10 blur-3xl" />

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E4F3F1] px-4 py-1.5 text-xs text-[#14232B] shadow-sm">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
          <span>Early Pilot Registration • Abeokuta Q4 Launch Access</span>
        </div>

        <h2 className="max-w-2xl font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl lg:text-5xl">
          Step onto the pulse of Abeokuta before anyone else.
        </h2>

        <p className="text-lg text-[#14232B]/70">
          Whether you're an everyday resident tired of wasted transport fare, or
          a local merchant and POS operator ready to broadcast live availability
          to thousands of neighbors, lock your spot in our staged corridor
          rollout.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {TICKER.map((t) => (
            <div
              key={t.label}
              className="inline-flex items-center gap-2 rounded-full bg-[#E9E2D0] px-3.5 py-1.5 text-xs text-[#14232B]"
            >
              <Icon name={t.icon} size={16} className="text-[#129E9E]" />
              <span className="font-bold">{t.label}</span>
              <span
                className={`font-semibold ${t.muted ? "text-[#14232B]/60" : "text-[#129E9E]"}`}
              >
                {t.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
