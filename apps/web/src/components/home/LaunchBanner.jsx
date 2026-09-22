import { Link } from "react-router-dom";

// W1 — Home. PRD: "Trust signal / launch banner (e.g., 'Now live in
// Abeokuta' or 'Launching soon in Abeokuta')."
// `status` covers Open Decision #2 (download badges vs. waitlist capture) —
// flip it to "live" once the app is on the stores, no copy rewrite needed.
export default function LaunchBanner({ status = "comingSoon" }) {
  const isLive = status === "live";

  return (
    <section className="bg-[#129E9E] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <p className="font-[Baloo_2] text-2xl font-bold text-[#FAF6EE] sm:text-3xl">
            {isLive ? "Now live in Abeokuta" : "Launching soon in Abeokuta"}
          </p>
          <p className="mt-2 max-w-md text-sm text-[#FAF6EE]/80">
            {isLive
              ? "We started in one neighbourhood and proved it works before growing — join the agents and shoppers already on City Pulse."
              : "We're piloting in Abeokuta first, one community at a time. Join the waitlist to be first in when we open."}
          </p>
        </div>

        <Link
          to="/download"
          className="shrink-0 rounded-full bg-[#FAF6EE] px-7 py-3.5 text-sm font-semibold text-[#129E9E] transition-colors hover:bg-white"
        >
          {isLive ? "Download the app" : "Join the waitlist"}
        </Link>
      </div>
    </section>
  );
}
