import Icon from "../shared/Icon";

export default function ProductHero() {
  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-6 pb-16 pt-10 sm:pt-14 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute -top-12 right-12 -z-10 h-96 w-96 rounded-full bg-[#129E9E]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-48 -z-10 h-72 w-72 rounded-full bg-[#E4F3F1]/60 blur-2xl" />

      <div className="flex max-w-4xl flex-col items-start gap-6">
        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#F0EADB] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#129E9E] shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
          About The Product • Core Architecture &amp; Value
        </div>

        <h1 className="font-[Baloo_2] text-4xl font-bold tracking-tight text-[#14232B] sm:text-5xl lg:text-6xl">
          Built to eliminate{" "}
          <span className="text-[#129E9E] underline decoration-[#129E9E]/20 underline-offset-8">
            blind trips
          </span>{" "}
          and wasted transport fare.
        </h1>

        <p className="max-w-2xl text-lg text-[#14232B]/70">
          In Nigerian daily life, searching for open POS points, cooking gas
          refills, fresh food, or trusted house agents costs hours of time and
          hard-earned cash. City Pulse turns urban uncertainty into real-time
          certainty.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href="#paradigm-shift"
            className="flex items-center gap-2 rounded-full bg-[#129E9E] px-6 py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
          >
            <span>Explore The Engine</span>
            <Icon name="arrow_downward" size={18} />
          </a>
          <a
            href="#four-categories"
            className="flex items-center gap-2 rounded-full bg-[#F6F1E6] px-6 py-3 text-sm font-semibold text-[#14232B] transition-all hover:bg-[#F0EADB]"
          >
            <span>See The 4 Core Verticals</span>
            <Icon name="category" size={18} />
          </a>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-3">
        <StatCard
          label="Average Friction Cost"
          icon="trending_down"
          iconClass="text-[#B5453B]"
          value="₦2,500+"
          note="Weekly transport fare drained on futile okada trips to unstocked stalls."
        />
        <StatCard
          label="The Staleness Guard"
          labelClass="text-[#129E9E]"
          icon="timer"
          iconClass="text-[#129E9E]"
          value="15-Min Decay"
          valueClass="text-[#129E9E]"
          note="Data automatically dims if a merchant hasn't signaled live status within the window."
        />
        <StatCard
          label="Local Accountability"
          icon="verified_user"
          iconClass="text-[#129E9E]"
          value="100% Grounded"
          note="Coordinators stationed physically in Panseke, Ibara, Camp & Omida."
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
        className={`font-[Baloo_2] text-3xl font-extrabold tracking-tight ${valueClass}`}
      >
        {value}
      </div>
      <p className="pt-2 text-sm text-[#14232B]/60">{note}</p>
    </div>
  );
}
