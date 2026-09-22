// W1 — Home. PRD: "How it works" in 3 simple steps
// (open the app → pick what you need → see who has it right now).
// Numbered steps are appropriate here because the content is a genuine sequence.
const STEPS = [
  {
    number: "01",
    title: "Open the app",
    description:
      "Launch City Pulse and choose the category you're after — cash, fuel, food, or housing.",
  },
  {
    number: "02",
    title: "Pick what you need",
    description:
      "Tell it exactly what you're looking for: a working POS agent, fuel in stock, a food seller open now, or a house agent nearby.",
  },
  {
    number: "03",
    title: "See who has it right now",
    description:
      "City Pulse shows live status near you, not a static list, so you head somewhere that's actually available.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[Baloo_2] text-3xl font-bold text-[#14232B] sm:text-4xl">
          How it works
        </h2>

        <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.number} className="relative">
              <span className="font-[Baloo_2] text-4xl font-bold text-[#129E9E]/25">
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-[#14232B]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#14232B]/70">
                {step.description}
              </p>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-[-1.5rem] top-4 hidden h-px w-8 bg-[#14232B]/15 sm:block"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
