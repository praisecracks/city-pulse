import Icon from "../shared/Icon";

const VERTICALS = [
  {
    icon: "point_of_sale",
    tag: "Financial Liquidity Radar",
    title: "POS & Cash Terminal Finder",
    text: 'Locate functioning points of sale with confirmed cash liquidity within a 500m radius. No more walking into booths only to hear "network is fluctuating."',
    specs: [
      ["Real-Time Float Indicator:", "High Cash / Low Float", "strong"],
      ["Terminal Queue Length:", "Under 3 mins wait", "normal"],
      ["Bank Network Health:", "Zenith & GTBank 98% OK", "strong"],
    ],
    avatarText: "₦",
    footerTitle: "Mummy Toluwa Kiosk — Ibara",
    footerNote: "Dispensing notes • Updated 4m ago",
    cta: "Trace Route",
  },
  {
    icon: "local_fire_department",
    tag: "Household Energy Grid",
    title: "Cooking Gas Refill Radar",
    text: "Save your shoulders and transport fare. Verify bulk depot pump status, per-kg price rates, and available canister accessories before lifting your cylinder out the door.",
    specs: [
      ["Cylinder Size Ready:", "3kg, 6kg, 12.5kg, 50kg", "normal"],
      ["Average Current Per-KG:", "₦1,150 / kg", "strong"],
      ["Depot Power State:", "Electric Pump Active", "strong"],
    ],
    avatarIcon: "propane",
    footerTitle: "Alhaja Standard Gas — Camp Junction",
    footerNote: "Bulk stock abundant • Dispensing",
    cta: "Price Check",
  },
  {
    icon: "restaurant",
    tag: "Culinary Pulse",
    title: "Street Eats & Local Kitchens",
    text: "Track iconic neighborhood bukas and food cart operations. Know when the morning Akara is hot, when fresh Amala batches drop, and whether evening Suya stands are alight.",
    specs: [
      ["Pot Freshness Cycle:", "New Batch Dropped (12m ago)", "strong"],
      ["Daily Specialties:", "Goat Meat, Gbegiri & Ewedu", "normal"],
      ["Seating Availability:", "Moderate Rush (8 seats free)", "normal"],
    ],
    avatarIcon: "soup_kitchen",
    footerTitle: "Surulere Amala Spot — Omida",
    footerNote: "Steaming hot • 20 portions left",
    cta: "View Menu",
  },
  {
    icon: "real_estate_agent",
    tag: "Anti-Fraud Shelter",
    title: "Verified House & Apartment Agents",
    text: "Eliminate fake inspections. Discover truly vacant self-contains, 2-bedroom flats, and student hostels in Abeokuta, verified by City Pulse coordinators.",
    specs: [
      [
        "Vacancy Verification:",
        "Key In Hand / Coordinator Inspected",
        "strong",
      ],
      ["Agent Identity:", "NIN Verified • Local Office ID", "normal"],
      ["Direct Connect:", "Direct Landlord-Rep WhatsApp", "strong"],
    ],
    avatarIcon: "apartment",
    footerTitle: "Modern 2-Bed Unit — Ibara GRA",
    footerNote: "Vacant • 0 Middleman fees",
    cta: "Inspect Direct",
  },
];

export default function CategoriesDeepDive() {
  return (
    <section
      className="w-full bg-[#F0EADB] py-20 lg:py-28"
      id="four-categories"
    >
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#129E9E]">
            Engineered for Daily Survival
          </span>
          <h2 className="mt-2 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            The 4 MVP Categories: Deep Dive
          </h2>
          <p className="mt-2 text-base text-[#14232B]/70">
            We refused to launch 50 generic listing categories that gather dust.
            Instead, we solved the four everyday resource crises in Abeokuta
            with extreme operational precision.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {VERTICALS.map((v) => (
            <div
              key={v.title}
              className="flex flex-col justify-between rounded-xl bg-white p-8 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#129E9E]/10 text-[#129E9E]">
                    <Icon name={v.icon} size={28} />
                  </div>
                  <span className="rounded-full bg-[#F6F1E6] px-3 py-1 text-xs font-semibold text-[#129E9E]">
                    {v.tag}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[#14232B]">
                  {v.title}
                </h3>
                <p className="mt-2 text-base text-[#14232B]/70">{v.text}</p>

                <div className="mt-6 space-y-3 rounded-lg bg-[#F6F1E6] p-4">
                  {v.specs.map(([label, value, weight]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-sm text-[#14232B]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#129E9E]" />
                        {label}
                      </span>
                      <span
                        className={
                          weight === "strong"
                            ? "font-bold text-[#129E9E]"
                            : "text-[#14232B]/70"
                        }
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#129E9E] text-xs font-bold text-[#FAF6EE]">
                    {v.avatarIcon ? (
                      <Icon name={v.avatarIcon} size={16} />
                    ) : (
                      v.avatarText
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#14232B]">
                      {v.footerTitle}
                    </span>
                    <span className="text-xs text-[#129E9E]">
                      {v.footerNote}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#129E9E]/10 px-4 py-2 text-xs font-semibold text-[#129E9E] transition-colors hover:bg-[#129E9E]/20"
                >
                  {v.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
