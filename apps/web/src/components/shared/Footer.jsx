import Logo from "../../assets/Logo.png";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low text-on-surface pt-20 pb-12 mt-5">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16">
          <div className="lg:col-span-4 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <a href="/" className="flex shrink-0 items-center">
                <img
                  src={Logo}
                  alt="City Pulse"
                  className="h-8 w-auto object-contain sm:h-9 md:h-10"
                />
              </a>
            </div>
            <p className="mt-2 max-w-xs text-sm text-[#14232B]/60">
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

          <div className="lg:col-span-4 flex flex-col gap-4">
            <span className="font-label-lg text-label-lg text-sm text-on-surface font-bold">
              Stay Ahead of the Pulse
            </span>
            <p className="font-body-sm text-body-sm text-sm text-on-surface-variant">
              Get early access alerts and neighbourhood utility status updates
              delivered to your inbox.
            </p>
            <div className="flex items-center gap-1 p-1.5 rounded-full  shadow-[0_1px_8px_rgba(0,0,0,0.04)] border ">
              <input
                className="flex-1 bg-transparent px-4 py-2  outline-0   focus:outline-none"
                placeholder="Enter your phone or email"
                type="email"
              />
              <a
                href="#waitlist-section"
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-1.5 card-hover-teal shadow-sm"
              >
                <span>Notify</span>
                {/* <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span> */}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col text-sm sm:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/20">
          <p>© 2024 City Pulse Technologies. Rooted with pride in Nigeria.</p>
          <div className="flex items-center gap-6">
            {["Terms of Service", "Privacy Policy", "Security"].map((item) => (
              <a
                key={item}
                className="hover:text-on-surface transition-colors"
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
    <div className="lg:col-span-2 flex flex-col gap-3">
      <span className="font-label-lg text-label-lg text-on-surface font-bold">
        {title}
      </span>
      {items.map((item) => (
        <a
          key={item}
          className="font-body-md text-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
          href="#"
        >
          {item}
        </a>
      ))}
    </div>
  );
}
