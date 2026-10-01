import Icon from "../shared/Icon";
import { CONTACT } from "../../data/contact";

const EMAIL_ROWS = [
  ["General Support", "Response in < 2 hrs", CONTACT.emails.general],
  ["Merchant Onboarding", "POS, gas stations & bukas", CONTACT.emails.agents],
  ["Press & Media", "Interviews, assets & kit", CONTACT.emails.press],
  ["Partnerships & Govt", "Unions, LGAs, transit hubs", CONTACT.emails.partners],
];

const SOCIALS = ["X / Twitter", "LinkedIn", "Telegram"];

export default function ContactChannels() {
  return (
    <div className="flex flex-col gap-6 lg:col-span-5">
      {/* Direct digital channels */}
      <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
              <Icon name="alternate_email" size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#14232B]">Direct Digital Channels</h3>
          </div>
          <span className="whitespace-nowrap rounded-full bg-[#F0EADB] px-2.5 py-1 text-xs font-semibold text-[#129E9E]">
            Active 24/7
          </span>
        </div>

        <div className="flex flex-col divide-y divide-[#14232B]/10">
          {EMAIL_ROWS.map(([title, sub, email]) => (
            <div key={email} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#14232B]">{title}</span>
                <span className="text-xs text-[#14232B]/60">{sub}</span>
              </div>
              <a href={`mailto:${email}`} className="break-all text-sm font-semibold text-[#129E9E] hover:underline">
                {email}
              </a>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-[#F6F1E6] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#129E9E]" />
              <span className="text-sm font-semibold text-[#14232B]">Official WhatsApp Live Desk</span>
            </div>
            <span className="text-xs font-semibold text-[#129E9E]">Fastest Resolution</span>
          </div>
          <p className="pt-1 font-[Baloo_2] text-xl font-bold tracking-tight text-[#129E9E]">
            {CONTACT.whatsappDisplay}
          </p>
          <p className="text-xs text-[#14232B]/60">{CONTACT.whatsappHours}</p>
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 w-full rounded-full bg-[#129E9E] py-2.5 text-center text-sm font-semibold text-[#FAF6EE] transition-all hover:bg-[#0E7F7F]"
          >
            Message on WhatsApp
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/60">Social Channels:</span>
          <div className="flex flex-wrap items-center gap-2">
            {SOCIALS.map((name) => (
              <a
                key={name}
                href="#"
                className="rounded-full bg-[#F0EADB] px-3 py-1.5 text-xs font-semibold text-[#14232B] transition-all hover:bg-[#129E9E] hover:text-[#FAF6EE]"
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Ground operations hub */}
      <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
              <Icon name="location_on" size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#14232B]">Ground Operations Hub</h3>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F0EADB] px-3 py-1 text-xs font-semibold text-[#129E9E]">
            <span className="h-2 w-2 rounded-full bg-[#129E9E]" />
            <span>Abeokuta HQ</span>
          </div>
        </div>

        {/* Static illustrative map graphic (PRD W5: not a functional map) */}
        <div
          className="relative flex h-44 w-full items-end overflow-hidden rounded-xl bg-[#E4F3F1] p-3 shadow-inner"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,158,158,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(18,158,158,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <Icon name="location_on" size={40} className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-[#129E9E]" />
          <div className="relative z-10 flex w-full items-center justify-between gap-2 rounded-lg bg-white/90 p-2.5 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Icon name="explore" size={20} className="text-[#129E9E]" />
              <span className="text-xs font-semibold text-[#14232B]">Quadrant 01: Oke-Ilewo Corridor</span>
            </div>
            <span className="text-xs font-semibold text-[#14232B]/60">Active Hub</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/60">Physical Address</span>
          <p className="text-lg font-bold leading-snug text-[#14232B]">{CONTACT.address}</p>
        </div>

        <div className="flex flex-col gap-1 rounded-lg bg-[#F6F1E6] p-3.5">
          <div className="flex items-center gap-2 text-[#14232B]">
            <Icon name="door_open" size={18} className="text-[#129E9E]" />
            <span className="text-sm font-semibold">On-Ground Walk-in Hours</span>
          </div>
          <p className="pl-6 text-xs text-[#14232B]/60">
            Monday – Friday: 8:30 AM – 5:30 PM WAT
            <br />
            <span className="font-semibold text-[#129E9E]">
              Dedicated to Agent Device Calibrations &amp; Micro-Vendor Onboarding
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-[#F0EADB] p-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#129E9E]" />
            <span className="text-xs font-semibold text-[#14232B]">Live Field Sweep Status</span>
          </div>
          <span className="text-xs font-bold text-[#129E9E]">Active in Panseke &amp; Omida</span>
        </div>
      </div>
    </div>
  );
}
