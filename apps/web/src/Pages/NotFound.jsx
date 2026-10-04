import { Link } from "react-router-dom";
import Icon from "../components/shared/Icon";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-[#F6F1E6] px-6 py-20 text-center">
      <span className="font-[Baloo_2] text-8xl font-bold text-[#129E9E]">
        404
      </span>
      <h1 className="mt-4 font-[Baloo_2] text-3xl font-bold tracking-tight text-[#14232B] sm:text-4xl">
        This Page doesn't exist.
      </h1>
      <p className="mt-3 max-w-md text-lg text-[#14232B]/70">
        The page you're looking for may have moved, or the link might be off.
        Let's get you back on the pulse.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 rounded-full bg-[#129E9E] px-6 py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F]"
        >
          <Icon name="home" size={18} />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/waitlist"
          className="flex items-center justify-center gap-1.5 rounded-full border border-[#14232B]/15 bg-white px-6 py-3 text-sm font-semibold text-[#14232B] shadow-sm transition-all hover:border-[#129E9E] hover:text-[#129E9E]"
        >
          <span>Join the Waitlist</span>
          <Icon name="arrow_forward" size={18} />
        </Link>
      </div>
    </section>
  );
}
