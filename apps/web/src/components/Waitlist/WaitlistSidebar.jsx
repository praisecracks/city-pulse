import Icon from "../shared/Icon";

const STATS = [
  ["2,410+", "Residents"],
  ["148", "Vendors"],
  ["6", "Hubs"],
];

const REGISTRATIONS = [
  ["BA", "Babatunde A. • Resident", "Ibara GRA • 3 mins ago"],
  ["RG", "Ronke's Gas Depot • Merchant", "Panseke Flyover • 11 mins ago"],
  ["TA", "Tolu POS Hub • POS Agent", "Camp / FUNAAB • 24 mins ago"],
];

export default function WaitlistSidebar() {
  return (
    <div className="flex flex-col gap-6 lg:col-span-5">
      {/* Street tile — illustrative graphic, swap for a real photo in src/assets */}
      <div className="relative overflow-hidden rounded-3xl shadow-sm">
        <div
          className="h-72 w-full bg-[#E4F3F1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,158,158,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(18,158,158,0.12) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#14232B]/90 via-[#14232B]/30 to-transparent p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E4F3F1]">
            Abeokuta Street Reality
          </span>
          <h3 className="text-lg font-bold text-[#FAF6EE]">
            Panseke &amp; Omida Corridor Pilot
          </h3>
          <p className="mt-1 text-sm text-[#FAF6EE]/80">
            Connecting 200+ micro-kiosks and gas depots directly to everyday
            commuter pockets.
          </p>
        </div>
      </div>

      {/* Live pulse */}
      <div className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#129E9E]" />
            <span className="text-sm font-bold text-[#14232B]">
              Live Waitlist Pulse
            </span>
          </div>
          <span className="rounded-full bg-[#E4F3F1] px-2.5 py-1 text-xs font-semibold text-[#129E9E]">
            Updated 2m ago
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {STATS.map(([value, label]) => (
            <div
              key={label}
              className="flex flex-col rounded-2xl bg-[#F6F1E6] p-3"
            >
              <span className="font-[Baloo_2] text-2xl font-extrabold text-[#129E9E]">
                {value}
              </span>
              <span className="mt-0.5 text-xs text-[#14232B]/60">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/50">
            Recent Registrations
          </span>
          {REGISTRATIONS.map(([initials, name, meta]) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl bg-[#F6F1E6] p-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#129E9E]/10 text-xs font-bold text-[#129E9E]">
                {initials}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-[#14232B]">
                  {name}
                </span>
                <span className="truncate text-xs text-[#14232B]/60">
                  {meta}
                </span>
              </div>
              <Icon
                name="verified"
                size={18}
                className="shrink-0 text-[#129E9E]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Batch capacity */}
      <div className="flex flex-col gap-4 rounded-3xl bg-[#F6F1E6] p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#14232B]">
            Batch 1 Capacity Bar
          </span>
          <span className="text-xs font-bold text-[#129E9E]">78% Filled</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E2DAC5]">
          <div
            className="h-full rounded-full bg-[#129E9E]"
            style={{ width: "78%" }}
          />
        </div>
        <p className="text-sm text-[#14232B]/60">
          Once Batch 1 closes at 3,000 residents, onboarding pauses until the
          field steward verification round finishes.
        </p>
      </div>
    </div>
  );
}
