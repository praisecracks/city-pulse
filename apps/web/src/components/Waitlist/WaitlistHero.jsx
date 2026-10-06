import Icon from "../shared/Icon";

const TICKER = [
  {
    icon: "trip_origin",
    label: "Abeokuta South:",
    value: "Joining Now",
  },
  { icon: "hourglass_top", label: "Abeokuta:", value: "Opening Next" },
  {
    icon: "bolt",
    label: "Ogun State:",
    value: "Coming Later",
    muted: true,
  },
];

export default function WaitlistHero() {
  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-6 pb-12 pt-10 lg:px-8 lg:pt-14">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-[#129E9E]/10 blur-3xl" />

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#129E9E] px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>Early Access • Abeokuta Live</span>
        </div>

        <h2 className="max-w-2xl font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl lg:text-5xl">
          Be among the first to use City Pulse in Abeokuta.
        </h2>

        <p className="text-lg text-[#14232B]/70">
          Join the waitlist for early access. City Pulse shows what is
          available near you right now, whether you need a place to stay, food,
          cooking gas or cash, or you are a provider who wants to be found.
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