import Icon from "../shared/Icon";

const CORRIDORS = [
  "Panseke",
  "Ibara GRA",
  "Camp (FUNAAB)",
  "Adigbe",
  "Omida",
  "Kuto",
];

export default function WaitlistMapRadar() {
  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 pb-24 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-white p-8 shadow-sm lg:flex-row lg:p-12">
        <div className="flex max-w-xl flex-col gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#129E9E]">
            <Icon name="satellite_alt" size={18} />
            <span>Interactive Ground Radar</span>
          </div>
          <h2 className="font-[Baloo_2] text-3xl font-extrabold tracking-tight text-[#14232B] sm:text-4xl">
            Launching first in Abeokuta, expanding street by street.
          </h2>
          <p className="text-base text-[#14232B]/70">
            From Panseke flyover to Camp Gate, we are indexing high-density
            commercial strips where citizens face the greatest daily friction
            with cash, energy, and provisions.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {CORRIDORS.map((c) => (
              <span
                key={c}
                className="rounded-full bg-[#F0EADB] px-3.5 py-1.5 text-sm font-semibold text-[#14232B]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div
          className="relative h-64 w-full shrink-0 overflow-hidden rounded-2xl bg-[#E4F3F1] shadow-sm lg:w-[460px]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,158,158,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(18,158,158,0.14) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          <Icon
            name="fmd_good"
            size={44}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#129E9E]"
          />
        </div>
      </div>
    </section>
  );
}
