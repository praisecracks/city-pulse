import Icon from "../shared/Icon";

const steps = [
  [
    "01",
    "Open the app",
    "Launch City Pulse and choose the category you're after — cash, fuel, food, or housing.",
    "touch_app",
    "Instant Launch",
  ],
  [
    "02",
    "Pick what you need",
    "Tell it exactly what you're looking for: a working POS agent, fuel in stock, a food seller open now, or a house agent nearby.",
    "tune",
    "Smart Filters",
  ],
  [
    "03",
    "See who has it right now",
    "City Pulse shows live status near you, not a static list, so you head somewhere that's actually available.",
    "check_circle",
    "Live Availability",
  ],
];

export default function HowItWorksSection() {
  return (
    <section
      className="w-full bg-[#FAF6EE] px-6 py-20 lg:px-12"
      id="how-it-works"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12">
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#129E9E]">
            Simple 3-Step Process
          </span>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map(([number, title, text, icon, label]) => (
            <div
              key={number}
              className="group flex flex-col items-start rounded-2xl border border-transparent bg-[#F6F1E6] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="font-[Baloo_2] text-5xl font-extrabold text-[#129E9E]/35 transition-colors group-hover:text-[#129E9E]">
                  {number}
                </span>
                <div className="h-0.5 w-12 bg-[#129E9E]/20" />
              </div>
              <h3 className="mb-2.5 text-lg font-bold text-[#14232B]">
                {title}
              </h3>
              <p className="text-base text-[#14232B]/70">{text}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#129E9E]">
                <Icon name={icon} size={18} />
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
