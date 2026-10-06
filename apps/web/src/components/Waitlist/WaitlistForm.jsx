import { useEffect, useState } from "react";
import Icon from "../shared/Icon";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const inputWrap =
  "flex items-center rounded-2xl bg-[#F6F1E6] px-4 py-3 transition-all focus-within:bg-white focus-within:shadow-[0_0_0_2px_#129E9E]";
const inputBase =
  "w-full bg-transparent text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:outline-none";
const selectBase = `${inputBase} cursor-pointer appearance-none`;

const PAINPOINTS = [
  ["housing", "House Agents / Property"],
  ["food", "Food Vendors / Restaurants"],
  ["gas", "Gas Refill"],
  ["pos", "POS / Cash Withdrawal"],
];

const NEIGHBORHOODS = [
  ["okemoson", "Okemoson / Secretariat"],
  ["ibara", "Ibara"],
  ["adigbe", "Adigbe / Opako"],
  ["kuto", "Kuto Market"],
  ["other", "Other Abeokuta South"],
];

const CATEGORIES = [
  ["housing", "House Agents / Property"],
  ["food", "Food Vendors / Restaurants"],
  ["gas", "Gas Refill"],
  ["pos", "POS / Cash Withdrawal"],
];

export default function WaitlistForm() {
  const [track, setTrack] = useState("resident");
  const [result, setResult] = useState(null); // null | "Resident" | "Merchant"

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), 5000);
    return () => clearTimeout(timer);
  }, [result]);

  return (
    <div className="flex flex-col gap-8 rounded-3xl bg-white p-6 shadow-sm sm:p-10 lg:col-span-12">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#14232B]/50">
          I am a...
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
            <span>Business or Agent</span>
          </button>
        </div>
      </div>

      {track === "resident" ? (
        <ResidentForm onSuccess={() => setResult("Resident")} />
      ) : (
        <MerchantForm onSuccess={() => setResult("Merchant")} />
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
              You're on the list!
            </span>
            <p className="text-base text-[#14232B]/70">
              {result === "Resident"
                ? "Thank you for joining. We'll contact you as soon as City Pulse opens in your area."
                : "Thank you for applying. A City Pulse field team member will contact you to arrange a visit and verify your business."}
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

function ResidentForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setSuccess("");
    setLoading(true);

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.preferences = fd.getAll("preferences");

    try {
      const res = await fetch(`${API_BASE}/waitlist/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          neighborhood: data.neighborhood,
          preferences: data.preferences,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      form.reset();
      setSuccess("You're on the waitlist! We'll be in touch soon.");
      onSuccess();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#14232B]">
          Early Access for Residents
        </h2>
        <p className="text-base text-[#14232B]/70">
          See what is available near you right now: a place to stay, food,
          cooking gas and cash.
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
        <Field label="Email" htmlFor="res-email" icon="mail">
          <input
            id="res-email"
            name="email"
            required
            type="email"
            placeholder="you@example.com"
            className={inputBase}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="res-phone"
            className="text-sm font-semibold text-[#14232B]"
          >
            Mobile Number
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="res-phone"
              name="phone"
              required
              type="tel"
              pattern="[0-9\s]{10,13}"
              placeholder="801 234 5678"
              className={inputBase}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="res-whatsapp"
            className="text-sm font-semibold text-[#14232B]"
          >
            WhatsApp Number (optional)
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="res-whatsapp"
              name="whatsapp"
              type="tel"
              pattern="[0-9\s]{10,13}"
              placeholder="801 234 5678"
              className={inputBase}
            />
          </div>
        </div>
      </div>

      <Field
        label="Your Area in Abeokuta"
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
          What do you need most? (choose all that apply)
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PAINPOINTS.map(([value, label]) => (
            <label
              key={value}
              className="flex items-start gap-3 rounded-2xl bg-[#F6F1E6] p-3.5 transition-colors hover:bg-[#F0EADB]"
            >
              <input
                className="mt-1 h-4 w-4 rounded accent-[#129E9E]"
                name="preferences"
                type="checkbox"
                value={value}
              />
              <span className="text-sm text-[#14232B]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-[#E4F3F1] p-3 text-sm text-[#129E9E]">
          {success}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F6F1E6] p-3">
        <input
          required
          className="h-4 w-4 rounded accent-[#129E9E]"
          type="checkbox"
          name="consent"
        />
        <span className="text-sm text-[#14232B]/70">
          Email me when City Pulse opens in my area
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-4 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Joining...</span>
          </>
        ) : (
          <>
            <span>Join the Waitlist</span>
            <Icon name="arrow_forward" size={20} />
          </>
        )}
      </button>
      <p className="text-center text-xs text-[#14232B]/50">
        We will only use your details to contact you about the City Pulse
        pilot.
      </p>
    </form>
  );
}

function MerchantForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setSuccess("");
    setLoading(true);

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    try {
      const res = await fetch(`${API_BASE}/waitlist/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: data.business,
          email: data.email,
          serviceType: data.category === "pos" ? "POS / Cash Withdrawal" :
                     data.category === "gas" ? "Gas Refill" :
                     data.category === "food" ? "Food Vendors / Restaurants" :
                     "House Agents / Property",
          phone: data.phone,
          whatsappPhone: data.whatsapp || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      form.reset();
      setSuccess("Application submitted! Our team will verify and reach out.");
      onSuccess();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 pb-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#129E9E]">
          <Icon name="verified" size={18} />
          <span>Free to Join During the Pilot</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#14232B]">
          Register Your Business
        </h2>
        <p className="text-base text-[#14232B]/70">
          Let people nearby see when you are open and what you have available,
          and get verified by our field team.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Business Name"
          htmlFor="merch-business"
          icon="store"
        >
          <input
            id="merch-business"
            name="business"
            required
            type="text"
            placeholder="e.g. Mama Tola Kitchen"
            className={inputBase}
          />
        </Field>
        <Field
          label="Owner or Manager Name"
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
        <Field label="Email" htmlFor="merch-email" icon="mail">
          <input
            id="merch-email"
            name="email"
            required
            type="email"
            placeholder="business@example.com"
            className={inputBase}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="merch-phone"
            className="text-sm font-semibold text-[#14232B]"
          >
            Mobile Number
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="merch-phone"
              name="phone"
              required
              type="tel"
              pattern="[0-9\s]{10,13}"
              placeholder="803 555 0192"
              className={inputBase}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="merch-whatsapp"
            className="text-sm font-semibold text-[#14232B]"
          >
            WhatsApp Number (optional)
          </label>
          <div className={inputWrap}>
            <span className="mr-2 text-sm font-bold text-[#129E9E]">+234</span>
            <input
              id="merch-whatsapp"
              name="whatsapp"
              type="tel"
              pattern="[0-9\s]{10,13}"
              placeholder="803 555 0192"
              className={inputBase}
            />
          </div>
        </div>
        <Field
          label="What Do You Offer?"
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
        label="Address and Nearest Landmark"
        htmlFor="merch-location"
        icon="location_on"
      >
        <input
          id="merch-location"
          name="location"
          required
          type="text"
          placeholder="e.g. Opposite the market gate, Ibara"
          className={inputBase}
        />
      </Field>

      <div className="flex items-start gap-3 rounded-2xl bg-[#E4F3F1] p-4">
        <Icon
          name="verified_user"
          size={22}
          className="mt-0.5 shrink-0 text-[#129E9E]"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#14232B]">
            In-Person Verification
          </span>
          <p className="text-sm text-[#14232B]/70">
            After you apply, a City Pulse field team member will visit your
            business to confirm your details and show you how to update your
            status.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-[#E4F3F1] p-3 text-sm text-[#129E9E]">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-6 py-4 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <span>Join as a Business or Agent</span>
            <Icon name="how_to_reg" size={20} />
          </>
        )}
      </button>
    </form>
  );
}