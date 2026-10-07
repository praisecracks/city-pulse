import { useEffect, useState } from "react";
import Icon from "../shared/Icon";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const inputClass =
  "w-full rounded-lg bg-[#F6F1E6] px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 transition-all focus:bg-white focus:outline-none focus:shadow-[0_0_0_2px_#129E9E]";

const WHATSAPP_NUMBER = "2347069991171";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi, this is for City Pulse.");

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      form.reset();
      setSuccess("Message sent! We'll get back to you shortly.");
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Form - takes 2/3 on desktop */}
      <div className="flex-1 lg:w-2/3 flex flex-col gap-8 rounded-xl bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-2">
          <h2 className="font-[Baloo_2] text-2xl font-bold text-[#14232B]">Send a Direct Message</h2>
          <p className="text-base text-[#14232B]/70">
            We read every message. Tell us what's on your mind.
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name *" id="cf-name">
              <input id="cf-name" name="name" required type="text" placeholder="e.g. Bukola Adewale" className={inputClass} />
            </Field>
            <Field label="Email Address *" id="cf-email">
              <input id="cf-email" name="email" required type="email" placeholder="b.adewale@example.com" className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone Number *" id="cf-phone">
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
            <Field label="WhatsApp Number (optional)" id="cf-whatsapp">
              <div className="flex items-center overflow-hidden rounded-lg bg-[#F6F1E6] transition-all focus-within:bg-white focus-within:shadow-[0_0_0_2px_#129E9E]">
                <span className="select-none bg-[#E4F3F1] px-3 py-3 text-sm font-semibold text-[#129E9E]">+234</span>
                <input
                  id="cf-whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="803 123 4567"
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:outline-none"
                />
              </div>
            </Field>
          </div>

          <Field label="Neighborhood / Area (optional)" id="cf-area">
            <input
              id="cf-area"
              name="area"
              type="text"
              placeholder="e.g. Panseke, Ibara, Camp, or your city"
              className={inputClass}
            />
          </Field>

          <Field label="Message *" id="cf-message">
            <textarea
              id="cf-message"
              name="message"
              required
              rows={5}
              placeholder="Tell us about your question, feedback, or what you need..."
              className={`${inputClass} resize-none`}
            />
          </Field>

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

          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#129E9E] px-8 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Message</span>
                  <Icon name="send" size={18} />
                </>
              )}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#14232B]/60">
              <Icon name="lock" size={16} className="text-[#129E9E]" />
              <span>No spam. Your data stays with our team.</span>
            </div>
          </div>

        </form>
      </div>

      {/* Contact Info Sidebar - 1/3 on desktop */}
      <div className="lg:w-1/3 flex-shrink-0">
        <div className="flex flex-col gap-6 rounded-xl bg-[#F0EADB] p-6 shadow-sm h-fit sticky top-24">
          <div className="flex items-center gap-3 text-lg font-bold text-[#14232B]">
            <Icon name="alternate_email" size={24} className="text-[#129E9E]" />
            <span>Get in Touch</span>
          </div>

          <div className="flex flex-col gap-4 text-sm text-[#14232B]/70">
            <a
              href="mailto:contact.citypulse@gmail.com"
              className="flex items-center gap-3 font-mono text-[#129E9E] hover:underline transition-colors"
            >
              <Icon name="alternate_email" size={20} className="text-[#129E9E] shrink-0" />
              <span>contact.citypulse@gmail.com</span>
            </a>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-full bg-[#129E9E] px-4 py-3 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
            >
              <Icon name="chat" size={20} className="shrink-0" />
              <span>Message on WhatsApp</span>
              <Icon name="arrow_outward" size={16} />
            </a>
          </div>

          <p className="pt-4 text-xs text-[#14232B]/50 border-t border-[#14232B]/10">
            We typically respond within a few hours during business hours.
          </p>
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