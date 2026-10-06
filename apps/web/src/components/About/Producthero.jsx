import Icon from "../shared/Icon";

export default function ProductHero() {
  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-6 pb-16 pt-10 sm:pt-14 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute -top-12 right-12 -z-10 h-96 w-96 rounded-full bg-[#129E9E]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-48 -z-10 h-72 w-72 rounded-full bg-[#E4F3F1]/60 blur-2xl" />

      <div className="flex max-w-4xl flex-col items-start gap-6">
        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#F0EADB] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#129E9E] shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
          About City Pulse
        </div>

        <h1 className="font-[Baloo_2] text-4xl font-bold tracking-tight text-[#14232B] sm:text-5xl lg:text-6xl">
          Built to end{" "}
          <span className="text-[#129E9E] underline decoration-[#129E9E]/20 underline-offset-8">
            blind trips
          </span>{" "}
          and wasted transport fare.
        </h1>

        <p className="max-w-2xl text-lg text-[#14232B]/70">
          In daily life across Nigeria, finding fresh food, cooking gas, a
          trusted house agent or an open POS point can cost hours of time and
          hard-earned cash. City Pulse shows you what is available near you
          right now, so you can go with confidence.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href="#paradigm-shift"
            className="flex items-center gap-2 rounded-full bg-[#129E9E] px-6 py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
          >
            <span>See What Makes It Different</span>
            <Icon name="arrow_downward" size={18} />
          </a>
          <a
            href="#four-categories"
            className="flex items-center gap-2 rounded-full bg-[#129E9E] px-6 py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
          >
            <span>See What You Can Find</span>
            <Icon name="category" size={18} />
          </a>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-3">
        <StatCard
          label="The Cost Of A Blind Trip"
          icon="trending_down"
          iconClass="text-[#B5453B]"
          value="Wasted Fare"
          note="Every trip to a place that is closed or out of stock costs you transport money and time."
          strikeValue
        />
        <StatCard
          label="Always Fresh"
          labelClass="text-[#129E9E]"
          icon="timer"
          iconClass="text-[#129E9E]"
          value="3-Hour Expiry"
          valueClass="text-[#129E9E]"
          note="A listing shows as Unconfirmed if the provider hasn't updated their status within 3 hours."
        />
        <StatCard
          label="Local Accountability"
          icon="verified_user"
          iconClass="text-[#129E9E]"
          value="On The Ground"
          note="Our field team signs up and verifies providers in person, starting in Abeokuta South."
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  labelClass = "text-[#14232B]/60",
  icon,
  iconClass,
  value,
  valueClass = "text-[#14232B]",
  note,
  strikeValue = false,
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(20,35,43,0.06)]">
      <div className="flex items-center justify-between pb-3">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}
        >
          {label}
        </span>
        <Icon name={icon} size={22} className={iconClass} />
      </div>
      <div
        className={`font-[Baloo_2] text-3xl font-extrabold tracking-tight ${valueClass} ${
          strikeValue ? "line-through decoration-2" : ""
        }`}
      >
        {value}
      </div>
      <p className="pt-2 text-sm text-[#14232B]/60">{note}</p>
    </div>
  );
}