import Icon from "../shared/Icon";

const STORIES = [
  {
    span: "lg:col-span-6",
    area: "Day 1 · Housing",
    statusIcon: "sentiment_dissatisfied",
    statusLabel: "Already Rented",
    title: "The 'Already Rented' Inspection Trip",
    text: "TUNDE finds a self-contain apartment through an online agent and pays an inspection fee. After travelling across town, he meets another tenant already there. The agent had offered the place to someone else, and the next property he suggests is also unverified. As the day runs out, TUNDE walks from street to street asking around for another agent or a place to sleep, and still finds nothing.",
    metaIcon: "home_work",
    meta: "Inspection fee lost • Fare wasted • Still no place to sleep",
  },
  {
    span: "lg:col-span-6",
    area: "Day 1 · Food",
    statusIcon: "soup_kitchen",
    statusLabel: "Pots Empty",
    title: "Arriving to Cold Stoves",
    text: "Hungry after a long day, TUNDE travels across town to a food spot a colleague praised, only to hear that the last pot finished twenty minutes ago.",
    metaIcon: "restaurant",
    meta: "Empty-handed • Fare wasted • No way to know in advance",
  },
  {
    span: "lg:col-span-7",
    area: "Day 3 · Cooking Gas",
    statusIcon: "power_off",
    statusLabel: "Out Of Gas",
    title: "Carrying an Empty Cylinder in the Sun",
    text: "To save money, TUNDE decides to cook for himself, but his gas runs out halfway through dinner. He carries the cylinder to the nearest gas plant, only to find it closed for the day, or waiting on a delivery that won't arrive until tomorrow.",
    metaIcon: "propane_tank",
    meta: "Heavy lifting • Wasted trip • No way to check stock",
  },
  {
    span: "lg:col-span-5",
    area: "Day 4 · Cash",
    statusIcon: "cancel",
    statusLabel: "POS Closed",
    title: "The Long Walk for Cash",
    text: "TUNDE needs cash, but there is no POS close to where he lives. Tired of walking to the street, the junction or the bus stop, he finally trudges there after a long trek, only to find the POS closed or out of the amount he needs.",
    metaIcon: "two_wheeler",
    meta: "Long trek • Time and energy lost • Still no cash",
  },
];

export default function ScarcityStories() {
  return (
    <section className="w-full bg-[#F6F1E6] py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F5E3E0] px-3 py-1 text-xs font-semibold text-[#B5453B]">
            <Icon name="report_problem" size={15} />
            <span>A Demo Story</span>
          </div>
          <h2 className="font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
            A Newcomer's First Week in Abeokuta
          </h2>
          <p className="mt-2 text-lg text-[#14232B]/70">
            Meet TUNDE, a corps member newly posted to Abeokuta. In his first
            week he needs a place to stay, food, cooking gas and cash. Each
            time, a trip to somewhere that wasn't ready costs him time and
            fare. Sound familiar?
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