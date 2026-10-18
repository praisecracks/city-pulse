import { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import AndroidDownloadAction from "./AndroidDownloadAction";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "Explore" },
  { to: "/waitlist", label: "Waitlist" },
];

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `transition-opacity hover:opacity-70 ${
      isActive ? "font-semibold text-white" : "text-white/80 hover:text-white"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `transition-opacity hover:opacity-70 ${
      isActive ? "font-semibold text-white" : "text-white/80 hover:text-white"
    }`;

  return (
    <nav className="sticky top-5 z-50 mx-auto mb-3 w-[92%] rounded-[30px] border border-[#129E9E]/30 bg-[#129E9E] px-4 py-3 shadow-sm sm:w-[90%] sm:px-6">
      <div className="relative mx-auto flex min-h-10 max-w-[1240px] items-center sm:px-2 lg:px-8 xl:px-12">
        <NavLink to="/" className="flex shrink-0 items-center">
          <img
            src={Logo}
            alt="City Pulse"
            className="h-8 w-auto object-contain sm:h-9 md:h-10"
          />
        </NavLink>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm text-white lg:flex xl:gap-10 xl:text-[16px]">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors lg:px-5 ${
                isActive ? "bg-[#078f7b]" : "bg-[#0E7F7F] hover:bg-[#078f7b]"
              }`
            }
          >
            Contact Us
          </NavLink>
          <AndroidDownloadAction compact />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#0E7F7F] text-white lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-full rounded-3xl border border-[#129E9E]/30 bg-[#129E9E] p-5 shadow-lg lg:hidden">
          <div className="flex flex-col gap-4 text-[15px]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsOpen(false)}
                className={mobileLinkClass}
              >
                {link.label}
              </NavLink>
            ))}

            <NavLink
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="mt-1 w-full rounded-full bg-[#0E7F7F] px-5 py-2.5 text-center font-semibold text-white transition-colors hover:bg-[#078f7b]"
            >
              Contact Us
            </NavLink>
            <AndroidDownloadAction />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
