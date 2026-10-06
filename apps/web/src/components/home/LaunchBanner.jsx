import { Link } from "react-router-dom";

export default function LaunchBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#129E9E] px-6 py-4 text-[#FAF6EE] md:px-12">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col gap-2 text-center md:flex-row md:items-center md:gap-3 md:text-left">
          <span className="relative flex h-3 w-3 self-center md:self-auto">
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FAF6EE]" />
          </span>
          <p className="text-lg font-bold tracking-tight text-[#FAF6EE]">
            Launching soon in Abeokuta
          </p>
          <p className="max-w-xl text-sm text-[#FAF6EE]/90">
            We're piloting in Abeokuta first. Join the waitlist to be first
            in when we open.
          </p>
        </div>
        <Link
          to="/waitlist"
          className="whitespace-nowrap rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0e7f7f] shadow-sm shadow-[#129E9E]/20 transition-all hover:bg-[#F0EADB]"
        >
          <p className="text-sm font-semibold text-[#0e7f7f]">
          Join the waitlist
          </p>
        </Link>
      </div>
    </section>
  );
}