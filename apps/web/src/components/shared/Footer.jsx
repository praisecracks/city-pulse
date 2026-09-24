import Logo from "../../assets/Logo.png";
import Icon from "./Icon";

export default function Footer() {
  return (
    <footer className="mt-5 w-full bg-[#F6F1E6] pb-12 pt-20 text-[#14232B]">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 pb-16 md:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-4 md:col-span-2 lg:col-span-4">
            <a href="/" className="flex shrink-0 items-center">
              <img
                src={Logo}
                alt="City Pulse"
                className="h-8 w-auto object-contain sm:h-9 md:h-10"
              />
            </a>
            <p className="max-w-xs text-sm text-[#14232B]/60">
              Find what you need, right near you, right now.
            </p>
          </div>

          <FooterLinks
            title="Product"
            items={[
              "Neighborhood Radar",
              "POS Terminal Finder",
              "Cooking Gas Refill",
              "Street Eats Tracker",
              "Merchant Partner App",
            ]}
          />
          <FooterLinks
            title="Company"
            items={[
              "Our Mission",
              "The Builders",
              "Careers",
              "Press Kit",
              "Contact Support",
            ]}
          />

          <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-4">
            <span className="text-sm font-bold text-[#14232B]">
              Stay Ahead of the Pulse
            </span>
            <p className="text-sm text-[#14232B]/60">
              Get early access alerts and neighbourhood utility status updates
              delivered to your inbox.
            </p>

            <div className="flex flex-col gap-2 rounded-2xl border border-[#14232B]/10 bg-white p-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-1 sm:rounded-full">
              <input
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:outline-none"
                placeholder="Enter your phone or email"
                type="email"
              />
              <a
                href="#waitlist-section"
                className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#129E9E] px-5 py-2.5 text-sm font-semibold text-[#FAF6EE] shadow-sm transition-all hover:bg-[#0E7F7F]"
              >
                <span>Notify</span>
                <Icon name="arrow_forward" size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#14232B]/10 pt-8 text-sm text-[#14232B]/60 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} City Pulse Technologies. Rooted with
            pride in Nigeria.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["Terms of Service", "Privacy Policy", "Security"].map((item) => (
              <a
                key={item}
                className="transition-colors hover:text-[#14232B]"
                href="#"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, items }) {
  return (
    <div className="flex flex-col gap-3 lg:col-span-2">
      <span className="text-sm font-bold text-[#14232B]">{title}</span>
      {items.map((item) => (
        <a
          key={item}
          className="text-sm text-[#14232B]/60 transition-colors hover:text-[#129E9E]"
          href="#"
        >
          {item}
        </a>
      ))}
    </div>
  );
}
