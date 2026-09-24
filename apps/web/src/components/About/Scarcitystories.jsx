import Icon from "../shared/Icon";

const STORIES = [
  {
    span: "lg:col-span-6",
    area: "Panseke Market Corridor",
    statusIcon: "cancel",
    statusLabel: '"No Cash"',
    title: "The 3-Stop Okada Cash Hunt",
    text: "You jump on a bike from Ibara to Panseke needing cash for market transactions. The first POS kiosk has no paper roll; the second machine declines all Zenith cards; the third has ran dry of physical notes. You've burned ₦700 in transport fare before buying a single item.",
    metaIcon: "two_wheeler",
    meta: "45 mins lost • ₦700 wasted fare • Total uncertainty",
  },
  {
    span: "lg:col-span-6",
    area: "Camp & FUNAAB Axis",
    statusIcon: "power_off",
    statusLabel: "Dry Depot / Out of Power",
    title: "Lugging Empty Cylinders in the Sun",
    text: "Your gas runs dry halfway through dinner prep. You haul a heavy steel 12.5kg cylinder across the avenue to your usual plant. The plant's generator is faulted, pump meters are dead, and their replacement delivery won't land till tomorrow noon.",
    metaIcon: "propane_tank",
    meta: "Heavy physical strain • Unpredictable per-kg rates",
  },
  {
    span: "lg:col-span-7",
    area: "Ibara GRA & Adigbe",
    statusIcon: "sentiment_dissatisfied",
    statusLabel: "Double Agent Fees",
    title: "The 'Already Rented' Inspection Loop",
    text: "You pay ₦5,000 non-refundable inspection fees to an online agent for a self-contain apartment. When you hike to the site in the humidity, another tenant is already unpacking. The agent shrugs, offering another unverified property 8 miles away.",
    metaIcon: "home_work",
    meta: "₦5,000 lost inspection fees • Middlemen extortion",
  },
  {
    span: "lg:col-span-5",
    area: "Omida & Kuto Junctions",
    statusIcon: "soup_kitchen",
    statusLabel: "Pots Empty",
    title: "Arriving to Cold Stoves",
    text: "Trekking through evening traffic for that legendary Amala point in Omida, only to discover the last stew batch emptied 20 minutes ago.",
    metaIcon: "restaurant",
    meta: "Zero live evening portion indicators",
  },
];

export default function ScarcityStories() {
  return (
    <section className="w-full bg-[#F6F1E6] py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F5E3E0] px-3 py-1 text-xs font-semibold text-[#B5453B]">
            <Icon name="report_problem" size={15} />
            <span>The Ground Reality</span>
          </div>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            The Hidden Tax of Everyday Friction in Abeokuta
          </h2>
          <p className="mt-2 text-lg text-[#14232B]/70">
            Western mapping algorithms assume store inventories never falter,
            power grids are immutable, and phone numbers belong to corporate
            desks. Here, reality works differently.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-12">
          {STORIES.map((story) => (
            <div
              key={story.title}
              className={`flex flex-col justify-between rounded-xl bg-white p-7 shadow-sm ${story.span}`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#F0EADB] px-2.5 py-1 text-xs font-semibold text-[#14232B]">
                  {story.area}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#B5453B]">
                  <Icon name={story.statusIcon} size={16} />
                  {story.statusLabel}
                </span>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-[#14232B]">
                  {story.title}
                </h3>
                <p className="text-base text-[#14232B]/70">{story.text}</p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 text-sm text-[#14232B]/60">
                <Icon
                  name={story.metaIcon}
                  size={20}
                  className="text-[#129E9E]"
                />
                <span>{story.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
