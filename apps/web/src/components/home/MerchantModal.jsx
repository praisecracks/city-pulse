import Icon from "../shared/Icon";

const inputClass =
  "w-full rounded-xl border border-[#14232B]/15 bg-white px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:border-[#129E9E] focus:outline-none focus:ring-2 focus:ring-[#129E9E]/20";

export default function MerchantModal({ open, onClose }) {
  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    window.alert("Thank you! A City Pulse Abeokuta community verifier will contact you within 24 hours.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#14232B]/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-3xl border border-[#14232B]/10 bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F1E6] text-[#14232B]/60 transition-colors hover:text-[#14232B]"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
            <Icon name="domain_add" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#14232B]">List Your Business</h3>
            <p className="text-sm text-[#14232B]/60">Abeokuta Merchant Network</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <input required className={inputClass} placeholder="e.g. Bukky Gas Hub / Segun POS" type="text" aria-label="Business Name" />
          <select className={inputClass} aria-label="Service Type">
            <option>POS Terminal Operator</option>
            <option>Cooking Gas Refill Station</option>
            <option>Food Vendor / Restaurant</option>
            <option>Verified Real Estate Agent</option>
          </select>
          <input required className={inputClass} placeholder="080..." type="tel" aria-label="Contact Phone" />
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-[#129E9E] py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
          >
            Submit for Free Verification
          </button>
        </div>
      </form>
    </div>
  );
}
