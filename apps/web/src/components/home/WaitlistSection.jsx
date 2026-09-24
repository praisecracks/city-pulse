import { useRef, useState } from "react";
import Icon from "../shared/Icon";

const neighborhoods = [
  ["panseke", "📍 Panseke"],
  ["ibara", "📍 Ibara Housing"],
  ["camp", "📍 FUNAAB / Camp"],
  ["adigbe", "📍 Adigbe"],
  ["kuto", "📍 Kuto Market"],
  ["other", "📍 Omida"],
];

const inputClass =
  "w-full rounded-xl border border-[#14232B]/15 bg-white px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:border-[#129E9E] focus:outline-none focus:ring-2 focus:ring-[#129E9E]/20";

export default function WaitlistSection() {
  const [neighborhood, setNeighborhood] = useState("panseke");
  const [submitted, setSubmitted] = useState(false);
  const selectRef = useRef(null);

  const chooseNeighborhood = (value) => {
    setNeighborhood(value);
    requestAnimationFrame(() => {
      selectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      selectRef.current?.focus();
    });
  };

  return (
    <section className="w-full bg-[#F6F1E6] px-6 py-20 lg:px-12" id="waitlist-section">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start gap-4 lg:col-span-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#129E9E]">
            Community-First Launch
          </span>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            Be the first to access City Pulse in your neighborhood.
          </h2>
          <p className="text-lg text-[#14232B]/70">
            We are rolling out street-by-street across Abeokuta: Panseke, Ibara, Camp, Adigbe, Kuto, and Omida. Join your local neighborhood queue to unlock immediate beta privileges.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {neighborhoods.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseNeighborhood(value)}
                className="rounded-full border border-transparent bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14232B]/70 shadow-sm transition-all hover:border-[#129E9E] hover:text-[#129E9E]"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 text-sm text-[#14232B]/70">
            <Icon name="groups" size={20} className="text-[#129E9E]" />
            <span>Partnering with local merchant associations, student leaders, and transport hubs.</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-col gap-6 rounded-3xl border border-[#14232B]/10 bg-white p-8 shadow-xl sm:p-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#14232B]">Claim Early Pilot Access</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F3F1] px-2.5 py-1 text-xs font-semibold text-[#129E9E]">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#129E9E]" />
                  Queue Open
                </span>
              </div>
              <span className="text-sm text-[#14232B]/60">
                Receive an instant WhatsApp SMS when your Abeokuta district opens.
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="flex flex-col gap-4"
            >
              {!submitted ? (
                <div className="flex flex-col gap-4">
                  <Field label="Full Name" id="full-name">
                    <input id="full-name" required type="text" placeholder="e.g. Babatunde Adeyemi" className={inputClass} />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="WhatsApp Number" id="phone-number">
                      <input id="phone-number" required type="tel" placeholder="0801 234 5678" className={inputClass} />
                    </Field>
                    <Field label="Your Neighborhood" id="neighborhood-select">
                      <select
                        ref={selectRef}
                        id="neighborhood-select"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="panseke">Panseke / Onikolobo</option>
                        <option value="ibara">Ibara GRA</option>
                        <option value="camp">Camp / Alabata (FUNAAB)</option>
                        <option value="adigbe">Adigbe / Opako</option>
                        <option value="kuto">Kuto / Isale-Igbein</option>
                        <option value="other">Other Abeokuta Area</option>
                      </select>
                    </Field>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#14232B]/60">
                      What do you search for most? (Live notification preferences)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-[#14232B]">
                      {["POS Cash", "Gas Refills", "Late Food", "Houses/Flats"].map((item, i) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 rounded-xl border border-transparent bg-[#F6F1E6] p-2.5 transition-all hover:bg-[#F0EADB] has-[:checked]:border-[#129E9E]/40 has-[:checked]:bg-[#E4F3F1]"
                        >
                          <input defaultChecked={i < 2} className="rounded accent-[#129E9E]" type="checkbox" />
                          <span className="text-sm font-medium">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
                    type="submit"
                  >
                    <span>Secure Early Pilot Pass</span>
                    <Icon name="verified" size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#F6F1E6] p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#129E9E] text-[#FAF6EE]">
                    <Icon name="check_circle" size={28} />
                  </div>
                  <h4 className="text-lg font-bold text-[#14232B]">You're on the Abeokuta list!</h4>
                  <p className="max-w-sm text-sm text-[#14232B]/70">
                    We've reserved your early invite. Watch your WhatsApp for a private download link and verified merchant updates.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-semibold text-[#129E9E] hover:underline"
                  >
                    Register another person or business
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#14232B]/60" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
