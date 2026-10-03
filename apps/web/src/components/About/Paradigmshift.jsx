import Icon from "../shared/Icon";

const STATIC_CONS = [
  [
    "Existence vs. Readiness",
    "Tells you a commercial building was registered in 2021, but completely blind to whether it is operating at this exact hour.",
  ],
  [
    "Zero Stock Transparency",
    "Cannot tell you if a POS terminal has ₦50k in cash, or if the gas depot has metric gas left in reserve.",
  ],
  [
    "Stale Operating Calendars",
    'Relies on generic "Open 9AM - 6PM" templates updated years ago that ignore public holidays, generator outages, or rain delays.',
  ],
  [
    "Phantom Agent Exploits",
    "Unchecked user submissions enable predatory property agents to post stock photos of apartments that don't exist.",
  ],
];

const RADAR_PROS = [
  [
    "The 15-Minute Expiration Rule",
    "Pins automatically fade if an operator hasn't tapped their state heartbeat. Only live, running spots shine bright on your radar.",
  ],
  [
    "1-Tap Merchant Float Toggles",
    'POS vendors switch between "Full Cash Dispense", "Low Float", or "Network Down" via a zero-data WhatsApp bot or ultra-lite web app.',
  ],
  [
    "Grounded Community Validation",
    'Scores earned through continuous accuracy verified by neighborhood shoppers tapping quick "Still Serving" feedback.',
  ],
  [
    "Direct Middleman-Free WhatsApp Chat",
    "Connect instantly to real landlords and verified merchants. No extortionate second-party fees or misleading photo bait.",
  ],
];

export default function ParadigmShift() {
  return (
    <section
      className="mx-auto w-full max-w-[1240px] px-6 py-20 lg:px-8 lg:py-28"
      id="paradigm-shift"
    >
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
          The Fundamental Paradigm Shift
        </span>
        <h2 className="mt-2 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
          Why Global Maps Fail at the Local Street Level
        </h2>
        <p className="mt-2 text-base text-[#14232B]/70">
          Static directories capture coordinates. City Pulse captures{" "}
          <em>inventory, energy, and human presence</em> in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
        {/* Static Maps */}
        <div className="flex flex-col justify-between rounded-xl bg-[#F6F1E6] p-8">
          <div>
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F3F1] text-[#14232B]/60">
                  <Icon name="public_off" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#14232B]">
                    Static Global Maps
                  </h3>
                  <span className="text-xs text-[#14232B]/50">
                    Google Maps, Apple Maps, Global Directories
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#F5E3E0] px-3 py-1 text-xs font-semibold text-[#B5453B]">
                Decoupled from Reality
              </span>
            </div>

            <ul className="space-y-5 pt-4">
              {STATIC_CONS.map(([title, text]) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon
                    name="close"
                    size={20}
                    className="mt-0.5 shrink-0 text-[#B5453B]"
                  />
                  <div>
                    <strong className="block text-sm font-semibold text-[#14232B]">
                      {title}
                    </strong>
                    <span className="text-sm text-[#14232B]/60">{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-lg bg-[#F0EADB] p-4 text-center">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#14232B]/60">
              Outcome For The Citizen
            </span>
            <p className="mt-1 text-sm font-medium text-[#B5453B]">
              High anxiety, repeated taxi expenditures, wasted afternoons.
            </p>
          </div>
        </div>

        {/* City Pulse Live Radar */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-8 shadow-md">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#129E9E]/10 blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
                  <Icon name="radar" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#14232B]">
                    City Pulse Live Radar
                  </h3>
                  <span className="text-xs font-semibold text-[#129E9E]">
                    Autonomous Dynamic State Engine
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#129E9E] px-3 py-1 text-xs font-semibold text-[#FAF6EE]">
                Real-Time Sync
              </span>
            </div>

            <ul className="space-y-5 pt-4">
              {RADAR_PROS.map(([title, text]) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon
                    name="check_circle"
                    size={20}
                    className="mt-0.5 shrink-0 text-[#129E9E]"
                  />
                  <div>
                    <strong className="block text-sm font-semibold text-[#14232B]">
                      {title}
                    </strong>
                    <span className="text-sm text-[#14232B]/60">{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-8 rounded-lg bg-[#129E9E]/10 p-4 text-center">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#129E9E]">
              Outcome For The Citizen
            </span>
            <p className="mt-1 text-sm font-bold text-[#129E9E]">
              Direct destination trips, guaranteed inventory, zero blind walks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
