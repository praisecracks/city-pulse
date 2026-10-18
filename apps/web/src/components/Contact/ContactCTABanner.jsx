import { Link } from "react-router-dom";
import AndroidDownloadAction from "../shared/AndroidDownloadAction";

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
            The Android app is ready, with public downloads opening soon. Join
            the waitlist for priority verification and faster onboarding.
          </p>
        </div>

        <div className="z-10 flex w-full flex-col items-center gap-4 sm:flex-row md:w-auto">
          <Link
            to="/waitlist"
            className="w-full rounded-full bg-white px-8 py-3.5 text-center text-sm font-semibold text-[#129E9E] shadow-sm transition-all hover:bg-[#FAF6EE] sm:w-auto"
          >
            Join Waitlist
          </Link>
          <AndroidDownloadAction />
          <span className="text-xs font-medium text-[#FAF6EE]/80">
            iOS app coming soon
          </span>
        </div>
      </div>
    </section>
  );
}
