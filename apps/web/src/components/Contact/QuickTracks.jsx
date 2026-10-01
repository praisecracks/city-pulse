import Icon from "../shared/Icon";
import { CONTACT } from "../../data/contact";

const TRACKS = [
  {
    icon: "point_of_sale",
    track: "Track 01",
    title: "For POS & Micro-Vendors",
    text: "Skip the form entirely. Join the next Tuesday morning on-ground onboarding walk in Ibara or Panseke with our Field Stewards.",
    label: "Direct Agent WhatsApp",
    href: CONTACT.whatsappLink,
  },
  {
    icon: "school",
    track: "Track 02",
    title: "Student & Campus Leads",
    text: "Enrolled at FUNAAB, MAPOLY, or FCE Osiele? Apply directly to lead your university cluster and run verified radar sweeps.",
    label: CONTACT.emails.campus,
    href: `mailto:${CONTACT.emails.campus}`,
  },
  {
    icon: "account_balance",
    track: "Track 03",
    title: "Transit & Market Leadership",
    text: "For Okada rider unions, NURTW branch chairs, and market Iyaloja councils seeking formal integration into verified routes.",
    label: "Executive Civic Liaison",
    href: `mailto:${CONTACT.emails.civic}`,
  },
  {
    icon: "trending_up",
    track: "Track 04",
    title: "Investors & Institutional",
    text: "Request our ground-truth metrics memo, Abeokuta unit economics, and multi-city scale rollout roadmap into Ibadan & Lagos.",
    label: CONTACT.emails.founders,
    href: `mailto:${CONTACT.emails.founders}`,
  },
];

export default function QuickTracks() {
  return (
    <section className="w-full bg-[#F6F1E6] py-20">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12 px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">Tailored Fast-Tracks</span>
            <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
              Need a Specialized Gateway?
            </h2>
          </div>
          <p className="max-w-md text-base text-[#14232B]/70">
            Skip generic inboxes. Route directly to our on-ground leads for faster turnaround.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((t) => (
            <div
              key={t.track}
              className="flex flex-col justify-between gap-6 rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E4F3F1] text-[#129E9E]">
                  <Icon name={t.icon} size={28} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#129E9E]">{t.track}</span>
                  <h3 className="text-lg font-bold text-[#14232B]">{t.title}</h3>
                  <p className="text-sm text-[#14232B]/70">{t.text}</p>
                </div>
              </div>
              <a
                href={t.href}
                className="inline-flex items-center gap-1.5 break-all text-sm font-semibold text-[#129E9E] hover:underline"
              >
                <span>{t.label}</span>
                <Icon name="arrow_forward" size={16} className="shrink-0" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
