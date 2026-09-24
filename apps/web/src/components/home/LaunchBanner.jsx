export default function LaunchBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#129E9E] px-6 py-4 text-[#FAF6EE] md:px-12">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3 text-left">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FAF6EE] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FAF6EE]" />
          </span>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-lg font-bold tracking-tight text-[#FAF6EE]">
              Launching soon in Abeokuta
            </span>
            <span className="hidden text-[#FAF6EE]/60 sm:inline-block">•</span>
            <p className="max-w-xl text-sm text-[#FAF6EE]/90">
              We're piloting in Abeokuta first, one community at a time. Join
              the waitlist to be first in when we open.
            </p>
          </div>
        </div>
        <a
          href="/#waitlist-section"
          className="whitespace-nowrap rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#129E9E] shadow-sm transition-all"
        >
          Join the waitlist
        </a>
      </div>
    </section>
  );
}
