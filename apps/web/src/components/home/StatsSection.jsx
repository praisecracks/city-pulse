import Icon from "../shared/Icon";

const stats = [
  ["payments", "₦0 Wasted Fare", "No more taking bike or cab across town just to find the cash agent closed or the gas cylinder pump dry."],
  ["timer", "Real-Time Radar", "Static maps show if a place exists; City Pulse shows if they actually have what you need right at this exact minute."],
  ["security", "Verified Agents", "Every vendor and property lister is vetted by local community pulse coordinators to eliminate fraud."],
];

export default function StatsSection() {
  return (
    <section className="w-full bg-[#F6F1E6] px-6 py-16 lg:px-12">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 md:grid-cols-3">
        {stats.map(([icon, title, text]) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-transparent bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#129E9E]/10 text-[#129E9E]">
              <Icon name={icon} size={26} />
            </div>
            <span className="mb-1 text-xl font-bold text-[#14232B]">{title}</span>
            <p className="text-base text-[#14232B]/70">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
