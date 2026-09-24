import Icon from "../shared/Icon";

const HORIZONS = [
  {
    icon: "local_pharmacy",
    phase: "Phase 2 • Abeokuta",
    title: "Pharmacy & Urgent Medicine Radar",
    text: "Locate 24/7 open neighborhood chemists with confirmed stock of essential antibiotics, inhalers, malaria treatments, and pediatrics after midnight.",
    note: "Protocols in architecture testing",
  },
  {
    icon: "build",
    phase: "Phase 3 • Abeokuta",
    title: "Artisan & Emergency Repair",
    text: "Instant on-demand verified electricians, mobile tyre vulcanizers, generator mechanics, and emergency plumbers ready for dispatch within your ward.",
    note: "Coordinator field screening Q4",
  },
  {
    icon: "map",
    phase: "Phase 4 • Regional Scale",
    title: "Ibadan, Lagos & Campus Hubs",
    text: "Replicating the Abeokuta coordination engine across high-density student corridors and underserved secondary cities across South-Western Nigeria.",
    note: "Network telemetry mapping active",
  },
];

export default function RoadmapSection() {
  return (
    <section className="w-full bg-[#F6F1E6] py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
              Product Evolution
            </span>
            <h2 className="mt-2 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
              The Roadmap Horizon
            </h2>
            <p className="mt-1 text-base text-[#14232B]/70">
              We solve the immediate everyday needs first, then systematically
              expand into deeper community infrastructure.
            </p>
          </div>
          <div className="rounded-full bg-[#F0EADB] px-4 py-2 text-xs font-semibold text-[#14232B]/60">
            No vague promises. Pure grounded utility.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HORIZONS.map((h) => (
            <div
              key={h.title}
              className="flex flex-col justify-between rounded-xl bg-white p-7 shadow-sm"
            >
              <div>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0EADB] text-[#129E9E]">
                  <Icon name={h.icon} size={24} />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
                  {h.phase}
                </div>
                <h3 className="mb-3 mt-1 text-lg font-bold text-[#14232B]">
                  {h.title}
                </h3>
                <p className="text-sm text-[#14232B]/70">{h.text}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 pt-4 text-xs font-semibold text-[#14232B]/50">
                <span className="h-2 w-2 rounded-full bg-[#129E9E]/50" />
                <span>{h.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
