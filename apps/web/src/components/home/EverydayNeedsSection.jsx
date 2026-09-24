import { useState } from "react";
import { categories, telemetryData } from "../../data/telemetry";
import Icon from "../shared/Icon";

export default function EverydayNeedsSection() {
  const [active, setActive] = useState("pos");
  const [refreshed, setRefreshed] = useState(false);
  const data = telemetryData[active];

  const chooseCategory = (key) => {
    setActive(key);
    setRefreshed(false);
  };

  return (
    <section
      className="w-full bg-white px-6 py-20 lg:px-12"
      id="everyday-needs"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E4F3F1] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#129E9E]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#129E9E]" />
              <span>Live Interactive Radar</span>
            </div>
            <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
              Four everyday needs, one app
            </h2>
          </div>
          <p className="max-w-md text-base text-[#14232B]/70">
            Tap each category below to simulate live telemetry from Abeokuta
            neighborhood hubs right now.
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          role="tablist"
        >
          {categories.map((category) => {
            const selected = active === category.key;
            return (
              <button
                key={category.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => chooseCategory(category.key)}
                className={`flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-6 text-left transition-all duration-300 ${
                  selected
                    ? "border-[#129E9E] bg-[#F0EADB] shadow-md ring-2 ring-[#129E9E]/20"
                    : "border-transparent bg-[#F6F1E6] hover:bg-[#F0EADB]"
                }`}
              >
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#129E9E] shadow-sm">
                    <Icon name={category.icon} size={24} />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="mb-2 text-lg font-bold text-[#14232B]">
                      {category.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        selected
                          ? "bg-[#129E9E] text-[#FAF6EE]"
                          : "bg-[#E9E2D0] text-[#14232B]/60"
                      }`}
                    >
                      {selected ? "Active" : "Tap to inspect"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#14232B]/70">
                    {category.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[#14232B]/10 pt-4 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-[#129E9E]">
                    <span
                      className={`h-2 w-2 rounded-full bg-[#129E9E] ${selected ? "animate-pulse" : "opacity-60"}`}
                    />
                    {category.feed}
                  </span>
                  <Icon
                    name={
                      selected
                        ? "radio_button_checked"
                        : "radio_button_unchecked"
                    }
                    size={18}
                    className={
                      selected ? "text-[#129E9E]" : "text-[#14232B]/40"
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="relative w-full overflow-hidden rounded-3xl border border-[#129E9E]/20 bg-[#F6F1E6] p-6 shadow-sm md:p-8"
          role="tabpanel"
        >
          <div className="flex flex-col items-start justify-between gap-6 border-b border-[#14232B]/10 pb-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#129E9E] text-[#FAF6EE] shadow-md">
                <Icon name={data.icon} size={30} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#129E9E] opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#129E9E]" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
                    {data.badge}
                  </span>
                  <span className="rounded-full bg-[#F0EADB] px-2 py-0.5 text-xs text-[#14232B]/60">
                    {refreshed ? "Refreshed just now" : "Updated 42s ago"}
                  </span>
                </div>
                <h3 className="mt-0.5 text-2xl font-bold text-[#14232B]">
                  {data.title}
                </h3>
                <p className="text-sm text-[#14232B]/60">{data.subtitle}</p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="flex items-center gap-2 rounded-xl border border-[#14232B]/10 bg-white px-4 py-2.5 shadow-sm">
                <Icon
                  name="verified_user"
                  size={20}
                  className="text-[#129E9E]"
                />
                <span className="text-xs font-semibold text-[#14232B]">
                  {data.trustLabel}
                </span>
              </div>
              <a
                href="#waitlist-section"
                className="flex items-center gap-1.5 rounded-full bg-[#129E9E] px-5 py-2.5 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
              >
                <span>Get Radar Alert</span>
                <Icon name="arrow_forward" size={16} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
            {data.metrics.map(([title, value, icon, note]) => (
              <div
                key={title}
                className="flex flex-col gap-1 rounded-2xl border border-[#14232B]/10 bg-white p-4 transition-all duration-300 hover:shadow-md"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/60">
                  {title}
                </span>
                <span className="font-[Baloo_2] text-2xl font-bold text-[#129E9E]">
                  {value}
                </span>
                <span className="flex items-center gap-1 text-sm text-[#14232B]/70">
                  <Icon name={icon} size={16} className="text-[#129E9E]" />
                  {note}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#14232B]/10 pt-4 text-xs text-[#14232B]/60">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#129E9E]" />
              <span>{data.note}</span>
            </div>
            <button
              type="button"
              onClick={() => setRefreshed(true)}
              className="transition-colors hover:text-[#129E9E]"
            >
              ↺ Refresh live packet
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
