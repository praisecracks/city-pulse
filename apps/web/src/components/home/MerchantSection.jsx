import Icon from "../shared/Icon";

export default function MerchantSection({ onOpenModal }) {
  return (
    <section className="w-full bg-[#FAF6EE] px-6 py-16 lg:px-12">
      <div className="relative mx-auto overflow-hidden rounded-3xl border border-transparent bg-[#F0EADB] p-8 md:p-12">
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[#129E9E]/10 blur-2xl" />
        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#129E9E]">
              <Icon name="storefront" size={16} />
              <span>For Local Merchants & Service Agents</span>
            </div>
            <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
              Run a business in Abeokuta? Put your business on the pulse.
            </h2>
            <p className="max-w-2xl text-lg text-[#14232B]/70">
              Whether you operate a POS kiosk at Ibara Roundabout, manage cooking gas refills in Camp, cook meals in Adigbe, or list apartments across Ogun State — get discovered by customers ready to buy this second.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenModal}
                className="rounded-full bg-[#129E9E] px-6 py-3 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
              >
                Register as an Agent / Merchant
              </button>
              <span className="text-sm text-[#14232B]/60">Takes under 2 minutes • Zero listing fees</span>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-4 lg:justify-end">
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[#14232B]/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#129E9E] text-[#FAF6EE]">
                  <Icon name="notifications_active" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#14232B]">Merchant Advantage</div>
                  <div className="text-sm text-[#14232B]/60">Foot traffic on demand</div>
                </div>
              </div>
              {["Toggle stock status with 1-click", "Reduce customer phone calls & inquiries", "Exclusive verified community badge"].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-[#14232B]">
                  <Icon name="check" size={18} className="text-[#129E9E]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
