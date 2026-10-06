import Icon from "../shared/Icon";

const VERTICALS = [
  {
    icon: "real_estate_agent",
    tag: "Verified Shelter",
    title: "Verified House & Apartment Agents",
    status: "live",
    text: "Avoid fake inspections. Find genuinely vacant self-contains, 2-bedroom flats and student hostels, with agents verified by our field team.",
  },
  {
    icon: "restaurant",
    tag: "Food",
    title: "Street Eats & Local Kitchens",
    status: "live",
    text: "Know when the morning akara is hot, when fresh amala is ready, and whether the evening suya stand is open, before you trek there.",
  },
  {
    icon: "local_fire_department",
    tag: "Cooking Gas",
    title: "Cooking Gas Refill Finder",
    status: "live",
    text: "See which sellers have gas in stock, with prices and cylinder sizes, before you carry your cylinder out the door.",
  },
  {
    icon: "point_of_sale",
    tag: "Cash",
    title: "POS & Cash Point Finder",
    status: "live",
    text: "Find a POS point near you that is open and has the cash you need. No more walking to a stand only to hear 'network is fluctuating.'",
  },
  {
    icon: "local_gas_station",
    tag: "Fuel",
    title: "Petrol Station Finder",
    status: "coming",
    text: "Check which stations have fuel before you join the queue, so you spend less time waiting and less money driving around.",
  },
  {
    icon: "local_pharmacy",
    tag: "Health",
    title: "Pharmacy & Chemist Finder",
    status: "coming",
    text: "Don't risk an empty pharmacy when you need medicine. See which chemists have what you need in stock before you go.",
  },
  {
    icon: "shopping_cart",
    tag: "Groceries",
    title: "Supermarkets & Provisions",
    status: "coming",
    text: "Setting up a new home? See which shops have the groceries and household items you need before you make the trip.",
  },
  {
    icon: "print",
    tag: "Printing",
    title: "Printing Shops & Cyber Cafes",
    status: "coming",
    text: "Find a printing shop or cyber cafe that is open and has power, for forms, assignments and important documents.",
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
            What You Can Find
          </span>
          <h2 className="mt-2 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            Everyday Services That Actually Matter
          </h2>
          <p className="mt-2 text-base text-[#14232B]/70">
            Not every shop has what you need when you need it. These are the
            everyday needs City Pulse starts with, and the services we are
            adding next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {VERTICALS.map((v) => (
            <div
              key={v.title}
              className="flex flex-col rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#129E9E]/10 text-[#129E9E]">
                  <Icon name={v.icon} size={24} />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    v.status === "live"
                      ? "bg-[#E4F3F1] text-[#129E9E]"
                      : "bg-[#F5E3E0] text-[#B5453B]"
                  }`}
                >
                  {v.status === "live" ? "At Launch" : "Coming Soon"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14232B]">
                {v.title}
              </h3>
              <p className="mt-1 text-sm text-[#14232B]/70">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}