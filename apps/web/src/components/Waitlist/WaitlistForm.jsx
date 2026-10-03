import { useState } from "react";
import Icon from "../shared/Icon";

const inputWrap =
  "flex items-center rounded-2xl bg-[#F6F1E6] px-4 py-3 transition-all focus-within:bg-white focus-within:shadow-[0_0_0_2px_#129E9E]";
const inputBase =
  "w-full bg-transparent text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:outline-none";
const selectBase = `${inputBase} cursor-pointer appearance-none`;

const PAINPOINTS = [
  ["pos", "Cash-dispensing POS points with low queues & low charges", true],
  ["gas", "Cooking gas plant live stock & verified per-kg rates", true],
  ["food", "Open Bukateria, hot amala, & late-night grills", false],
  [
    "housing",
    "Verified self-contain & flats with zero bogus agency fees",
    false,
  ],
];

const NEIGHBORHOODS = [
  ["panseke", "Panseke (Omida Road, Flyover, Onikolobo axis)"],
  ["ibara", "Ibara GRA & Lalubu Commercial District"],
  ["camp", "Camp & FUNAAB Gate Corridor"],
  ["adigbe", "Adigbe & Opako Axis"],
  ["omida", "Omida Market & Sapon"],
  ["kuto", "Kuto Motor Park & Isale-Igbein"],
  ["obantoko", "Obantoko & Asero Corridor"],
  ["mapoly", "MAPOLY Campus / Ojere Outskirts"],
];

const CATEGORIES = [
  ["pos", "POS Terminal / Cash Agent"],
  ["gas", "Cooking Gas Refill Depot"],
  ["food", "Bukateria / Street Grills / Food Vendor"],
  ["housing", "Verified Real Estate / Housing Scout"],
  ["pharmacy", "Pharmacy & Night Provision Kiosk"],
];

export default function WaitlistForm() {
  const [track, setTrack] = useState("resident");
  const [result, setResult] = useState(null); // null | "Resident" | "Merchant"

  // No backend yet. `data` has every field (incl. multi-checkboxes as an
  // array for `painpoints`) — wire the real submit here.
  const submit = (role) => (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    data.painpoints = fd.getAll("painpoints");
    console.log("waitlist form", role, data);
    e.currentTarget.reset();
    setResult(role);
  };

  return (
    <div className="flex flex-col gap-8 rounded-3xl bg-white p-6 shadow-sm sm:p-10 lg:col-span-7">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/50">
          Choose your onboarding track
        </span>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#F6F1E6] p-1.5">
          <button
            type="button"
            aria-pressed={track === "resident"}
            onClick={() => setTrack("resident")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all ${
              track === "resident"
                ? "bg-[#129E9E] text-[#FAF6EE] shadow-sm"
                : "text-[#14232B]/60 hover:bg-[#E9E2D0] hover:text-[#14232B]"
            }`}
          >
            <Icon name="person_pin_circle" size={20} />
            <span>Resident</span>
          </button>
          <button
            type="button"
            aria-pressed={track === "merchant"}
            onClick={() => setTrack("merchant")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all ${
              track === "merchant"
                ? "bg-[#129E9E] text-[#FAF6EE] shadow-sm"
                : "text-[#14232B]/60 hover:bg-[#E9E2D0] hover:text-[#14232B]"
            }`}
          >
            <Icon name="storefront" size={20} />
            <span>Merchant & Agent</span>
          </button>
        </div>
      </div>

      {track === "resident" ? (
        <ResidentForm onSubmit={submit("Resident")} />
      ) : (
        <MerchantForm onSubmit={submit("Merchant")} />
      )}

      {result && (
        <div
          role="status"
          className="flex items-start gap-4 rounded-2xl bg-[#F0EADB] p-6"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#129E9E]/15 text-[#129E9E]">
            <Icon name="task_alt" size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-[#14232B]">
              Queue Position Secured!
            </span>
            <p className="text-base text-[#14232B]/70">
              {result === "Resident"
                ? "Your Resident Early Access spot for Abeokuta Batch 1 is reserved! Look out for a verification ping on WhatsApp shortly."
                : "Merchant application received! A City Pulse student corridor steward will visit your stall within 48 hours for verification tag setup."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, htmlFor, icon, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#14232B]">
        {label}
      </label>
      <div className={inputWrap}>
        {icon && (
          <Icon
            name={icon}
            size={20}
            className="mr-2.5 shrink-0 text-[#14232B]/40"
          />
        )}
        {children}
      </div>
    </div>
  );
}

function ResidentForm({ onSubmit }) {
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1 pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#14232B]">
          Neighborhood Resident Early Access
        </h2>
        <p className="text-base text-[#14232B]/70">
          Get priority alerts for cash terminals, verified gas refill depot
          prices, and trusted rentals near your street.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="res-name" icon="badge">
          <input
            id="res-name"
            name="name"
            required
            type="text"
            placeholder="e.g. Babatunde Adeyemi"
            className={inputBase}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="res-phone"
            className="text-sm font-semibold text-[#14232B]"
          >
            WhatsApp Number
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="res-phone"
              name="phone"
              required
              type="tel"
              pattern="[0-9\s]{9,11}"
              placeholder="801 234 5678"
              className={inputBase}
            />
          </div>
        </div>
      </div>

      <Field
        label="Primary Abeokuta Neighborhood"
        htmlFor="res-neighborhood"
        icon="explore"
      >
        <select
          id="res-neighborhood"
          name="neighborhood"
          required
          defaultValue=""
          className={selectBase}
        >
          <option value="" disabled>
            Select your area...
          </option>
          {NEIGHBORHOODS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-[#14232B]">
          Everyday Bottlenecks You Want Solved Most (choose all that apply)
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PAINPOINTS.map(([value, label, checked]) => (
            <label
              key={value}
              className="flex items-start gap-3 rounded-2xl bg-[#F6F1E6] p-3.5 transition-colors hover:bg-[#F0EADB]"
            >
              <input
                defaultChecked={checked}
                className="mt-1 h-4 w-4 rounded accent-[#129E9E]"
                name="painpoints"
                type="checkbox"
                value={value}
              />
              <span className="text-sm text-[#14232B]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-[#14232B]">
          How frequently do you hunt for cash or utility supplies?
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            ["daily", "Daily", true],
            ["2-3times", "2–3 times a week", false],
            ["weekly", "Weekly", false],
          ].map(([value, label, def]) => (
            <label
              key={value}
              className="cursor-pointer rounded-full bg-[#F6F1E6] px-4 py-2 text-sm font-semibold text-[#14232B] transition-colors hover:bg-[#F0EADB] has-[:checked]:bg-[#129E9E] has-[:checked]:text-[#FAF6EE]"
            >
              <input
                defaultChecked={def}
                className="sr-only"
                name="frequency"
                type="radio"
                value={value}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F6F1E6] p-3">
        <input
          defaultChecked
          required
          className="h-4 w-4 rounded accent-[#129E9E]"
          type="checkbox"
          name="consent"
        />
        <span className="text-sm text-[#14232B]/70">
          Send instant WhatsApp / SMS priority launch link when my street
          corridor is activated
        </span>
      </label>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-4 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
      >
        <span>Reserve Resident Early Access</span>
        <Icon name="arrow_forward" size={20} />
      </button>
      <p className="text-center text-xs text-[#14232B]/50">
        Zero spam guarantee. Your contact is only used for Abeokuta pilot cohort
        deployment.
      </p>
    </form>
  );
}

function MerchantForm({ onSubmit }) {
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1 pb-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#129E9E]">
          <Icon name="verified" size={18} />
          <span>Zero Listing Fees Throughout Pilot Phase</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#14232B]">
          Register Your Kiosk, Cash Point, or Store
        </h2>
        <p className="text-base text-[#14232B]/70">
          Broadcast live availability to nearby residents, cut out idle
          downtime, and receive an authentic physical City Pulse verification
          tag.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Business / Kiosk Name"
          htmlFor="merch-business"
          icon="store"
        >
          <input
            id="merch-business"
            name="business"
            required
            type="text"
            placeholder="e.g. Segun & Sons POS Hub"
            className={inputBase}
          />
        </Field>
        <Field
          label="Operator / Manager Name"
          htmlFor="merch-operator"
          icon="person"
        >
          <input
            id="merch-operator"
            name="operator"
            required
            type="text"
            placeholder="e.g. Segun Daniel"
            className={inputBase}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="merch-phone"
            className="text-sm font-semibold text-[#14232B]"
          >
            WhatsApp Business Number
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="merch-phone"
              name="phone"
              required
              type="tel"
              pattern="[0-9\s]{9,11}"
              placeholder="803 555 0192"
              className={inputBase}
            />
          </div>
        </div>
        <Field
          label="Business Category"
          htmlFor="merch-category"
          icon="category"
        >
          <select
            id="merch-category"
            name="category"
            required
            defaultValue=""
            className={selectBase}
          >
            <option value="" disabled>
              Choose category...
            </option>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Stall Street Address & Nearest Landmark"
        htmlFor="merch-location"
        icon="location_on"
      >
        <input
          id="merch-location"
          name="location"
          required
          type="text"
          placeholder="e.g. Opposite GTBank Panseke Flyover, beside chemist kiosk"
          className={inputBase}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Operating Hours" htmlFor="merch-hours" icon="schedule">
          <input
            id="merch-hours"
            name="hours"
            required
            type="text"
            placeholder="e.g. 7:30 AM – 9:30 PM Daily"
            className={inputBase}
          />
        </Field>
        <Field
          label="Preferred Update Method"
          htmlFor="merch-update-method"
          icon="phonelink_ring"
        >
          <select
            id="merch-update-method"
            name="updateMethod"
            required
            defaultValue="whatsapp"
            className={selectBase}
          >
            <option value="whatsapp">1-Tap WhatsApp Status Bot</option>
            <option value="sms">Free Zero-Data SMS Reply</option>
            <option value="steward">In-Person Student Steward Visit</option>
          </select>
        </Field>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#E4F3F1] p-4">
        <Icon
          name="verified_user"
          size={22}
          className="mt-0.5 shrink-0 text-[#129E9E]"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#14232B]">
            Physical Verification Walk-In
          </span>
          <p className="text-sm text-[#14232B]/70">
            Within 48 hours of onboarding submission, a certified City Pulse
            student steward in your corridor will visit your spot to drop off a
            verification sticker and test live ping delivery.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-4 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
      >
        <span>Apply for Verified Merchant Onboarding</span>
        <Icon name="how_to_reg" size={20} />
      </button>
    </form>
  );
}
