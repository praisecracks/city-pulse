import Icon from "../shared/Icon";

const PERKS = [
  {
    icon: "notifications_active",
    title: "Zero-Fare Guesswork",
    text: 'Never pay bike or cab transport to an ATM or POS kiosk only to hear "no network" or "cash finished". Receive live status radar directly in your pocket.',
    meta: "Batch 1 Residents receive instant priority pings",
  },
  {
    icon: "groups",
    title: "120+ Ground Stewards",
    text: "Trained student coordinators across FUNAAB and MAPOLY physically visit kiosks and calibrate operational hours to guarantee zero fake agents.",
    meta: "Every merchant gets physical verification",
  },
  {
    icon: "trending_up",
    title: "Direct Foot Traffic Routing",
    text: "When you broadcast available cash or replenished cooking gas cylinders, nearby residents within a 2km radius are routed directly to your door.",
    meta: "Free physical window badge during rollout",
  },
];

export default function WaitlistPerks() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 pb-24 lg:px-8">
      <div className="mx-auto mb-12 flex max-w-xl flex-col gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          Built for Real Life
        </span>
        <h2 className="font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl">
          Why Early Registration Matters
        </h2>
        <p className="text-base text-[#14232B]/70">
          We are deploying street by street to avoid inaccurate data or ghost
          listings. Here is what pilot members receive on day one.
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
