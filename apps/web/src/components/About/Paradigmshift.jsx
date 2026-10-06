import Icon from "../shared/Icon";

const STATIC_CONS = [
  [
    "Existence, not readiness",
    "Shows that a shop is there, but not whether it is open and serving right now.",
  ],
  [
    "No stock or cash visibility",
    "Can't tell you if a vendor has food ready, a seller has gas, or an agent has cash.",
  ],
  [
    "Hours that go out of date",
    "Listed hours often miss public holidays, power cuts and bad weather.",
  ],
  [
    "Listings you can't always trust",
    "Anyone can post a listing, so fake or outdated entries get through, including apartments that don't exist.",
  ],
];

const RADAR_PROS = [
  [
    "Status that expires",
    "If a provider doesn't confirm their status within 3 hours, the listing shows as Unconfirmed instead of misleading you.",
  ],
  [
    "Providers update in one tap",
    "Providers mark themselves available, running low or unavailable with a single tap.",
  ],
  [
    "Trust scores from the community",
    "Every listing has a 1–5 trust score, built from verification and feedback from people who used it.",
  ],
  [
    "Contact providers directly",
    "Call or WhatsApp the provider yourself, with no middleman.",
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
          Why City Pulse Is Different
        </span>
        <h2 className="mt-2 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
          Maps show you where. We show you what's happening now.
        </h2>
        <p className="mt-2 text-base text-[#14232B]/70">
          Google Maps tells you a place exists. City Pulse tells you if it's
          available right now, and how much to trust it.
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
                    Maps and Directories
                  </h3>
                  <span className="text-xs text-[#14232B]/50">
                    Google Maps, Apple Maps, online directories
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#F5E3E0] px-3 py-1 text-xs font-semibold text-[#B5453B]">
                Shows Places, Not Availability
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
              Wasted trips, extra transport fare, lost time.
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
                    City Pulse
                  </h3>
                  <span className="text-xs font-semibold text-[#129E9E]">
                    Live local availability
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#129E9E] px-3 py-1 text-xs font-semibold text-[#FAF6EE]">
                Live Status
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
              Go straight to what is open. Fewer wasted trips.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}