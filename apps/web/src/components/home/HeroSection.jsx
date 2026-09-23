import HeroFlipCard from "./HeroFlipCard";

export default function HeroSection() {
  return (
    <section className="relative w-full px-6 lg:px-12 pt-12 lg:pt-20 pb-20 overflow-hidden bg-gradient-to-b from-surface via-surface-container-low/40 to-surface">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shadow-sm border border-primary/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="font-semibold text-primary">Live Abeokuta Radar Active</span>
            <span className="text-on-surface-variant/60">•</span>
            <span className="text-on-surface-variant font-normal">Panseke, Ibara, Kuto</span>
          </div>

          <div className="flex flex-col space-y-2">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
              Find what you need. <br />
              <span className="inline-flex flex-wrap items-baseline gap-3">
                Near you.
                <span className="relative inline-block px-3 py-1 bg-primary text-on-primary rounded-lg -rotate-1 shadow-sm hover:rotate-0 transition-transform">
                  Right now.
                </span>
              </span>
            </h1>
            <p className="font-body-md text-body-md text-primary font-semibold tracking-wide uppercase mt-1">
              Right Near You • Right Near You • Right Near You
            </p>
          </div>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Tired of wasted trips and transport fare searching for open POS points, cooking gas, fresh food, or trusted house agents? City Pulse checks who has what in stock in real time.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
            <a href="#waitlist-section" className="px-7 py-3.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 card-hover-teal">
              <span>Join the Abeokuta Pilot</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </a>
            <a href="#everyday-needs" className="px-6 py-3.5 rounded-full bg-surface-container-lowest text-primary font-label-lg text-label-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2 shadow-sm border border-outline-variant/40">
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>Explore Live Radar Demo</span>
            </a>
          </div>

          <div className="pt-6 flex flex-wrap items-center gap-6">
            <div className="flex -space-x-2 overflow-hidden">
              {["AO", "TA", "KO", "+4k"].map((label, i) => (
                <div key={label} className={`inline-block h-8 w-8 rounded-full flex items-center justify-center font-label-sm text-label-sm ${i === 3 ? "bg-primary text-on-primary" : "bg-secondary-container text-on-surface"}`}>
                  {label}
                </div>
              ))}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="text-on-surface font-semibold">1,820+ Abeokuta residents</strong> signed up across Panseke, Ibara, & Kuto.
            </p>
          </div>
        </div>

        <HeroFlipCard />
      </div>
    </section>
  );
}
