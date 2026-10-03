// import { useRef, useState } from "react";
import Icon from "../shared/Icon";
import { Link } from "react-router-dom";

// const neighborhoods = [
//   ["panseke", "📍 Panseke"],
//   ["ibara", "📍 Ibara Housing"],
//   ["camp", "📍 FUNAAB / Camp"],
//   ["adigbe", "📍 Adigbe"],
//   ["kuto", "📍 Kuto Market"],
//   ["other", "📍 Omida"],
// ];

export default function WaitlistSection() {
  return (
    <section
      className="w-full bg-[#F6F1E6] px-6 py-20 lg:px-12"
      id="waitlist-section"
    >
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start gap-4 lg:col-span-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#129E9E]">
            Community-First Launch
          </span>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            Be the first to access City Pulse in your neighborhood.
          </h2>
          <p className="text-lg text-[#14232B]/70">
            We are rolling out street-by-street across Abeokuta: Panseke, Ibara,
            Camp, Adigbe, Kuto, and Omida. Join your local neighborhood queue to
            unlock immediate beta privileges.
          </p>

          <div className="flex items-center gap-3 pt-4 text-sm text-[#14232B]/70">
            <Icon name="groups" size={20} className="text-[#129E9E]" />
            <span>
              Partnering with local merchant associations, student leaders, and
              transport hubs.
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-col gap-6 rounded-3xl border border-[#14232B]/10 bg-white p-8 shadow-xl sm:p-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#14232B]">
                  Claim Early Pilot Access
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F3F1] px-2.5 py-1 text-xs font-semibold text-[#129E9E]">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#129E9E]" />
                  Queue Open
                </span>
              </div>
              <span className="text-sm text-[#14232B]/60">
                Receive an instant WhatsApp SMS when your Abeokuta district
                opens.
              </span>
            </div>

            <Link to="/waitlist">
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]">
                <span>Secure Early Pilot Pass</span>
                <Icon name="verified" size={18} />
              </button>
            </Link>

            <Link to="/waitlist">
              <button className="mt-2 text-xs text-center font-semibold text-[#129E9E] hover:underline">
                Register another person or business
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
