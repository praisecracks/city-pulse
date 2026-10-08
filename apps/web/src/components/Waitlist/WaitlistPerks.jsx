import Icon from "../shared/Icon";

const PERKS = [
  {
    icon: "notifications_active",
    title: "Never Waste a Trip Again",
    text: "Know before you go. Get real-time alerts when POS has cash, gas depots have stock, or your favorite food spot is open — straight to your phone.",
    meta: "Batch 1 gets priority access",
  },
  {
    icon: "groups",
    title: "Verified by Real People",
    text: "Our 120+ local stewards physically visit every shop and agent. No fake listings, no ghost agents — only places that are actually open and serving.",
    meta: "Every merchant verified in person",
  },
  {
    icon: "trending_up",
    title: "Be Found by Ready Customers",
    text: "When you update your status — cash available, gas in stock, rooms vacant — nearby residents see it instantly and come straight to you.",
    meta: "Free verified badge for early merchants",
  },
];

export default function WaitlistPerks() {
  return (
    <section className="min-w-0 mx-auto w-full max-w-[1240px] px-6 pb-24 lg:px-8">
      <div className="mx-auto mb-12 flex max-w-xl flex-col gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          Built for Real Life
        </span>
        <h2 className="font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl">
          Why Early Registration Matters
        </h2>
        <p className="text-base text-[#14232B]/70">
          We're rolling out street by street in Abeokuta. Early registrants get
          first access and help shape the service for their neighborhood.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PERKS.map((p) => (
          <div
            key={p.title}
            className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F3F1] text-[#129E9E]">
              <Icon name={p.icon} size={28} />
            </div>
            <span className="text-lg font-bold text-[#14232B]">{p.title}</span>
            <p className="text-base text-[#14232B]/70">{p.text}</p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-[#129E9E]">
              <Icon name="check_circle" size={16} />
              <span>{p.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}