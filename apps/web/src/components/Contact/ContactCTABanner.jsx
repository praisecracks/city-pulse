import { Link } from "react-router-dom";

export default function ContactCTABanner() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 pb-12 lg:px-8">
      <div className="relative flex w-full flex-col items-center justify-between gap-8 overflow-hidden rounded-2xl bg-[#129E9E] p-10 shadow-lg sm:p-14 md:flex-row">
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#FAF6EE]/10 blur-3xl" />

        <div className="z-10 flex max-w-xl flex-col gap-3 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FAF6EE]/80">
            Ground-Truth Navigation
          </span>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#FAF6EE] sm:text-4xl">
            Ready to stop guessing and start knowing?
          </h2>
          <p className="text-base leading-relaxed text-[#FAF6EE]/80">
            Get live neighborhood utility intelligence right on your phone. Join
            the Abeokuta early pilot waitlist or list your kiosk today.
          </p>
        </div>

        <div className="z-10 flex w-full flex-col items-center gap-4 sm:flex-row md:w-auto">
          <Link
            to="/waitlist"
            className="w-full rounded-full bg-white px-8 py-3.5 text-center text-sm font-semibold text-[#129E9E] shadow-sm transition-all hover:bg-[#FAF6EE] sm:w-auto"
          >
            Join Waitlist
          </Link>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full bg-[#0E7F7F]/30 px-7 py-3.5 text-center text-sm font-semibold text-[#FAF6EE]/60 sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 10V6a4 4 0 0 1 8 0v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="13"
                  x2="12"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Coming Soon
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
