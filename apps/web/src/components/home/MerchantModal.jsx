import { useState } from "react";
import Icon from "../shared/Icon";

const inputClass =
  "w-full rounded-xl border border-[#14232B]/15 bg-white px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:border-[#129E9E] focus:outline-none focus:ring-2 focus:ring-[#129E9E]/20";

export default function MerchantModal({ open, onClose }) {
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("POS Terminal Operator");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setBusinessName("");
    setServiceType("POS Terminal Operator");
    setPhone("");
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/waitlist/agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName, serviceType, phone }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#14232B]/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#14232B]/10 bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F1E6] text-[#14232B]/60 transition-colors hover:text-[#14232B]"
        >
          <Icon name="close" size={18} />
        </button>

        {!success ? (
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
                <Icon name="domain_add" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14232B]">
                  List Your Business
                </h3>
                <p className="text-sm text-[#14232B]/60">
                  Abeokuta Merchant Network
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <input
                required
                className={inputClass}
                placeholder="e.g. Bukky Gas Hub / Segun POS"
                type="text"
                aria-label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <select
                className={inputClass}
                aria-label="Service Type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option>POS Terminal Operator</option>
                <option>Cooking Gas Refill Station</option>
                <option>Food Vendor / Restaurant</option>
                <option>Verified Real Estate Agent</option>
              </select>
              <input
                required
                className={inputClass}
                placeholder="080..."
                type="tel"
                aria-label="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#129E9E] py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F] disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit for Free Verification"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#129E9E] text-[#FAF6EE]">
              <Icon name="check_circle" size={28} />
            </div>
            <h4 className="text-lg font-bold text-[#14232B]">
              You're on the list!
            </h4>
            <p className="max-w-sm text-sm text-[#14232B]/70">
              A City Pulse Abeokuta community verifier will contact you within
              24 hours.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 text-xs font-semibold text-[#129E9E] hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
