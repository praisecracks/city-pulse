import { Outlet, Link } from "react-router-dom";
import NavBar from "./components/shared/NavBar";

// PRD Section 5: footer repeats the same six links as the header nav.
// NOTE: this duplicates NAV_LINKS in NavBar.jsx — worth extracting both
// to a single src/data/nav.js once the site has more than these two spots.
const FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "About the Product", to: "/about/product" },
  { label: "About the Company", to: "/about/company" },
  { label: "The Builders", to: "/team" },
  { label: "Download & How to Use", to: "/download" },
  { label: "Contact Us", to: "/contact" },
];

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE]">
      <NavBar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#14232B]/10 px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-[Baloo_2] text-lg font-bold text-[#14232B]">
              CITY <span className="text-[#129E9E]">PULSE</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-[#14232B]/60">
              Find what you need, right near you, right now.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3"
            aria-label="Footer"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-[#14232B]/70 hover:text-[#129E9E]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm text-[#14232B]/60">
            <a
              href="mailto:hello@citypulse.app"
              className="hover:text-[#129E9E]"
            >
              hello@citypulse.app
            </a>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-6xl text-xs text-[#14232B]/40">
          © {new Date().getFullYear()} City Pulse. Currently piloting in
          Abeokuta.
        </p>
      </footer>
    </div>
  );
}
