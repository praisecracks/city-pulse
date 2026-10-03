import { useEffect, useState } from "react";
import Icon from "../shared/Icon";

const watTime = () =>
  new Date().toLocaleTimeString("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ContactHero() {
  const [time, setTime] = useState(watTime);

  useEffect(() => {
    const id = setInterval(() => setTime(watTime()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-6 pb-16 pt-10 lg:px-8">
      <div className="flex max-w-4xl flex-col items-start gap-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E9E2D0] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#14232B] shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
          Contact Us • Open Channels | Abeokuta Operations &amp; Global Partnerships
        </div>

        <h1 className="font-[Baloo_2] text-4xl font-bold tracking-tight text-[#14232B] sm:text-5xl lg:text-6xl">
          Let's connect on the <span className="italic text-[#129E9E]">pulse</span> of everyday utility.
        </h1>

        <p className="max-w-3xl text-lg leading-relaxed text-[#14232B]/70">
          Whether you are a local vendor ready to list on the radar, a university partner, a journalist covering African urban tech, or an engineer looking to build with us — our team responds within 24 hours.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Pill icon="schedule">
            Abeokuta Local Time: <strong className="text-[#14232B]">{time} WAT</strong>
          </Pill>
          <Pill icon="speed">
            Average SLA: <strong className="text-[#129E9E]">&lt; 4 Hours</strong>
          </Pill>
          <Pill icon="support_agent">Dedicated Agent Support Desk Live</Pill>
        </div>
      </div>
    </section>
  );
}

function Pill({ icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#F6F1E6] px-4 py-2 text-xs font-semibold text-[#14232B] shadow-sm">
      <Icon name={icon} size={18} className="text-[#129E9E]" />
      <span>{children}</span>
    </div>
  );
}
