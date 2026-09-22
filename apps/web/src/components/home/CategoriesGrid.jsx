// W1 — Home. PRD: "The four categories at a glance:
// POS/Cash, Food Vendors, Gas Refill, House Agents."
// Deeper explanations of each live on About the Product (W2) — this is
// intentionally light, so all four cards share one simple pattern.
const CATEGORIES = [
  {
    icon: "💵",
    title: "POS / Cash",
    description: "Find an agent with cash on hand nearby.",
  },
  {
    icon: "⛽",
    title: "Gas Refill",
    description: "See who has fuel in stock before you queue.",
  },
  {
    icon: "🍲",
    title: "Food Vendors",
    description: "Know who's open and serving right now.",
  },
  {
    icon: "🏠",
    title: "House Agents",
    description: "Reach verified agents with listings near you.",
  },
];

export default function CategoriesGrid() {
  return (
    <section className="bg-[#E4F3F1]/50 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[Baloo_2] text-3xl font-bold text-[#14232B] sm:text-4xl">
          Four everyday needs, one app
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#14232B]/10 bg-[#FAF6EE] p-6"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-xl bg-[#129E9E]/10 text-xl"
              >
                {icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-[#14232B]">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#14232B]/70">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
