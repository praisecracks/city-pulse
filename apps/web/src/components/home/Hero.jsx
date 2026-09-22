import { Link } from "react-router-dom";
import heroImage from "../../assets/hero-shopper.png";

// W1 — Home, hero region (PRD Section 6).
// Acceptance criteria: value prop + download CTA visible without scrolling on mobile.
const CATEGORIES = [
  { label: "POS / Cash", icon: "💵" },
  { label: "Food Vendors", icon: "🍲" },
  { label: "Gas Refill", icon: "⛽" },
  { label: "House Agents", icon: "🏠" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE] px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#129E9E]/30 bg-[#FAF6EE] px-4 py-1.5 text-xs font-semibold text-[#129E9E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#129E9E]" />
            Launching soon in Abeokuta
          </span>

          <h1 className="mt-6 font-[Baloo_2] text-4xl font-bold leading-[1.05] text-[#14232B] sm:text-5xl lg:text-6xl">
            Find what you need.
            <br />
            Right near you, right now.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[#14232B]/70 sm:text-lg">
            Cash, fuel, food, or a house to rent — City Pulse shows you who has
            it available nearby right now, so you stop wasting trips and
            transport money guessing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/download"
              className="rounded-full bg-[#129E9E] px-7 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-lg shadow-[#129E9E]/25 transition-colors hover:bg-[#0E7F7F]"
            >
              Download the app
            </Link>
            <Link
              to="/about/product"
              className="text-sm font-semibold text-[#14232B] underline decoration-[#129E9E]/40 decoration-2 underline-offset-4 hover:decoration-[#129E9E]"
            >
              See how it works
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {CATEGORIES.map(({ label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-[#14232B]/70"
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2rem] bg-[#129E9E]/15" />
          <img
            src={heroImage}
            alt="A City Pulse user carrying shopping bags after finding a nearby vendor with what they needed"
            className="w-full rounded-[2rem] object-cover shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
