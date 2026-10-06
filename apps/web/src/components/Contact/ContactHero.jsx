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
      <div className="pointer-events-none absolute -top-12 right-12 -z-10 h-96 w-96 rounded-full bg-[#129E9E]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-48 -z-10 h-72 w-72 rounded-full bg-[#E4F3F1]/60 blur-2xl" />

      <div className="flex max-w-4xl flex-col items-start gap-6">
        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#F0EADB] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#129E9E] shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
          We Are Listening
        </div>

        <h1 className="font-[Baloo_2] text-4xl font-bold tracking-tight text-[#14232B] sm:text-5xl lg:text-6xl">
          Reach out. <br />
          <span className="relative inline-block -rotate-1 rounded-lg bg-[#129E9E] px-3 py-1 text-[#FAF6EE] shadow-sm transition-transform hover:rotate-0">
            We respond.
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-[#14232B]/70">
          Whether you have a question, contribution, feedback, or just want to understand
          what we're building, send us a message. A real person reads every
          one.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F6F1E6] px-4 py-2 text-xs font-semibold text-[#14232B] shadow-sm">
            <Icon name="schedule" size={18} className="text-[#129E9E]" />
            <span>Abeokuta Time: <strong className="text-[#14232B]">{time} WAT</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}