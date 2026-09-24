import { Link } from "react-router-dom";

export default function ProductCTABanner() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 py-12 lg:px-8 lg:py-16">
      <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-xl bg-[#129E9E] p-8 shadow-xl sm:p-14 lg:flex-row">
        <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-[#0E7F7F] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#FAF6EE] opacity-10 blur-3xl" />

        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <span className="mb-4 inline-block rounded-full bg-[#FAF6EE]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FAF6EE]">
            Experience The Pulse
          </span>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#FAF6EE] sm:text-4xl">
            Ready to stop guessing and start knowing?
          </h2>
          <p className="mt-2 text-base text-[#FAF6EE]/80">
            Join hundreds of residents across Ibara, Panseke, and Camp getting
            real-time resource certainty delivered right to their screens.
          </p>
        </div>

        <div className="relative z-10 flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
          {/* Waitlist lives on Home, not this page — cross-page hash needs
              the ScrollToHash effect noted below to actually scroll. */}
          <Link
            to="/#waitlist-section"
            className="w-full rounded-full bg-white px-8 py-4 text-center text-sm font-semibold text-[#129E9E] shadow-md transition-all hover:bg-[#FAF6EE] sm:w-auto"
          >
            Join the Abeokuta Waitlist
          </Link>
          <Link
            to="/download"
            className="w-full rounded-full bg-[#FAF6EE]/15 px-8 py-4 text-center text-sm font-semibold text-[#FAF6EE] transition-all hover:bg-[#FAF6EE]/25 sm:w-auto"
          >
            How to Use City Pulse
          </Link>
        </div>
      </div>
    </section>
  );
}
