import { useState } from "react";
import Icon from "../shared/Icon";
import { CONTACT } from "../../data/contact";

const TRACKS = [
  ["merchant", "Become an Agent / Merchant", "POS, Gas, Bukas, Housing agents"],
  ["partnerships", "Partnership & Municipalities", "Transit unions, LGA, campus alliances"],
  ["press", "Press & Media Inquiries", "Interviews, brand assets & stories"],
  ["careers", "Careers & Field Stewards", "Engineering, product, ground sweeps"],
  ["general", "General Inquiry & Community Feedback", "Feature ideas, neighborhood bugs, or general feedback"],
];

const NEIGHBORHOODS = [
  ["panseke", "Panseke Commercial Spine"],
  ["ibara", "Ibara / Oke-Ilewo Axis"],
  ["camp", "Camp / FUNAAB Corridor"],
  ["adigbe", "Adigbe / Opako Line"],
  ["kuto", "Kuto Bus Terminal / Market"],
  ["omida", "Omida Market / Totoro"],
  ["outside", "Other / Outside Abeokuta"],
];

const inputClass =
  "w-full rounded-lg bg-[#F6F1E6] px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 transition-all focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_#129E9E]";

export default function ContactForm() {
  const [track, setTrack] = useState("merchant");
  const [sent, setSent] = useState(false);

  // No backend yet (PRD Section 8: serverless function or form service).
  // Wire the real submit here — `data` has every field incl. inquiry_track.
  const submit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log("contact form", data);
    e.currentTarget.reset();
    setTrack("merchant");
    setSent(true);
  };

  return (
    <div className="flex flex-col gap-6 lg:col-span-7">
      <div className="flex flex-col gap-8 rounded-xl bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-2">
          <h2 className="font-[Baloo_2] text-2xl font-bold text-[#14232B]">Send a Direct Message</h2>
          <p className="text-base text-[#14232B]/70">
            Pick the track that matches your inquiry to reach the right coordinator immediately.
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={submit}>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#14232B]/60">
              Select Your Routing Track *
            </legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TRACKS.map(([value, title, sub], i) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-3.5 text-left transition-all ${
                    i === TRACKS.length - 1 ? "sm:col-span-2" : ""
                  } ${
                    track === value
                      ? "bg-[#E4F3F1] shadow-[0_0_0_1.5px_rgba(18,158,158,0.5)]"
                      : "bg-[#F6F1E6] hover:bg-[#F0EADB]"
                  }`}
                >
                  <input
                    className="mt-1 accent-[#129E9E]"
                    type="radio"
                    name="inquiry_track"
                    value={value}
                    checked={track === value}
                    onChange={() => setTrack(value)}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-[#14232B]">{title}</span>
                    <span className="text-xs text-[#14232B]/60">{sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name *" id="cf-name">
              <input id="cf-name" name="name" required type="text" placeholder="e.g. Bukola Adewale" className={inputClass} />
            </Field>
            <Field label="Email Address *" id="cf-email">
              <input id="cf-email" name="email" required type="email" placeholder="b.adewale@example.com" className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone / WhatsApp Number *" id="cf-phone">
              <div className="flex items-center overflow-hidden rounded-lg bg-[#F6F1E6] transition-all focus-within:bg-white focus-within:shadow-[0_0_0_2px_#129E9E]">
                <span className="select-none bg-[#E4F3F1] px-3 py-3 text-sm font-semibold text-[#129E9E]">+234</span>
                <input
                  id="cf-phone"
                  name="phone"
                  required
                  type="tel"
                  placeholder="803 123 4567"
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Neighborhood / Axis *" id="cf-area">
              <select id="cf-area" name="neighborhood" required defaultValue="" className={`${inputClass} cursor-pointer`}>
                <option value="" disabled>Select location in Abeokuta</option>
                {NEIGHBORHOODS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Message & Business Context *" id="cf-message">
            <textarea
              id="cf-message"
              name="message"
              required
              rows={4}
              placeholder="Tell us about your kiosk, organization, or questions..."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <label className="flex cursor-pointer select-none items-start gap-3">
            <input name="updates" defaultChecked type="checkbox" className="mt-1 h-4 w-4 rounded accent-[#129E9E]" />
            <span className="text-sm text-[#14232B]/60">
              I would also like to receive pilot launch updates, verification sweep alerts, and priority merchant notices for my ward.
            </span>
          </label>

          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-8 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F] sm:w-auto"
            >
              <span>Submit Inquiry</span>
              <Icon name="send" size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#14232B]/60">
              <Icon name="lock" size={16} className="text-[#129E9E]" />
              <span>No spam. Data handled strictly by Abeokuta coordinators.</span>
            </div>
          </div>

          {sent && (
            <div role="status" className="flex items-center gap-3 rounded-lg bg-[#E4F3F1] p-4 text-sm text-[#14232B]">
              <Icon name="check_circle" size={20} className="shrink-0 text-[#129E9E]" />
              <span>Inquiry received! A neighborhood coordinator will reach out on your phone/WhatsApp within 4 hours.</span>
            </div>
          )}
        </form>
      </div>

      <div className="flex items-start gap-4 rounded-xl bg-[#F0EADB] p-5 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
          <Icon name="chat" size={22} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-[#14232B]">Urgent Onboarding in Panseke or Camp?</span>
          <p className="text-sm text-[#14232B]/70">
            Are you a POS operator or Gas Depot owner needing verification today? Skip email delays and message our field team on WhatsApp for same-day inspection.
          </p>
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-[#129E9E] hover:underline"
          >
            <span>Open WhatsApp Merchant Onboarding Desk</span>
            <Icon name="arrow_outward" size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-[#14232B]/60">{label}</label>
      {children}
    </div>
  );
}
