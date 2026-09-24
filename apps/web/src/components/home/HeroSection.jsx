import HeroFlipCard from "./HeroFlipCard";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { label: "POS / Cash", icon: "💵" },
  { label: "Food Vendors", icon: "🍲" },
  { label: "Gas Refill", icon: "⛽" },
  { label: "House Agents", icon: "🏠" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE] px-6 pb-20 pt-12 lg:px-12 lg:pt-10">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col items-start gap-6 lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#129E9E]/30 bg-[#FAF6EE] px-4 py-1.5 text-xs font-semibold text-[#129E9E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#129E9E]" />
            Launching soon in Abeokuta
          </span>
          {/* uncomment after launch */}

          {/* <div className="inline-flex items-center gap-2.5 rounded-full border border-[#129E9E]/20 bg-[#E4F3F1] px-3.5 py-1.5 text-xs shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#129E9E] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#129E9E]" />
            </span>
            <span className="font-semibold text-[#129E9E]">
              Live Abeokuta Radar Active
            </span>
            <span className="text-[#14232B]/40">•</span>
            <span className="text-[#14232B]/60">Panseke, Ibara, Kuto</span>
          </div> */}

          <h1 className="font-[Baloo_2] text-4xl font-bold leading-[1.05] tracking-tight text-[#14232B] sm:text-5xl lg:text-6xl">
            Find what you need. <br />
            <span className="inline-flex flex-wrap items-baseline gap-3">
              Near you.
              <span className="relative inline-block -rotate-1 rounded-lg bg-[#129E9E] px-3 py-1 text-[#FAF6EE] shadow-sm transition-transform hover:rotate-0">
                Right now.
              </span>
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-[#14232B]/70">
            Tired of wasted trips and transport fare searching for open POS
            points, cooking gas, fresh food, or trusted house agents? City Pulse
            checks who has what in stock in real time.
          </p>

          <div className="flex w-full flex-wrap items-center gap-4 pt-2 sm:w-auto">
            <a
              href="#waitlist-section"
              className="flex items-center justify-center gap-2 rounded-full bg-[#129E9E] px-7 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F] hover:shadow-lg"
            >
              {/* Download the app */}
              Join the Waitlist
              <ArrowIcon />
            </a>

            <Link
              to="/about/product"
              className="flex items-center justify-center gap-2 rounded-full border border-[#14232B]/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#129E9E] shadow-sm transition-all hover:bg-[#E4F3F1]"
            >
              <PlayIcon />
              <span>See how it works</span>
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-3 gap-y-4">
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

        <HeroFlipCard />
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.3 7l4.4 3-4.4 3V7z" fill="currentColor" />
    </svg>
  );
}
