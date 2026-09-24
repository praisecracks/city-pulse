import { useState } from "react";
import Logo from "../../assets/Logo.png";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative z-50 mx-auto mt-5 mb-3 w-[92%] rounded-[30px] border border-gray-200 bg-white px-4 py-3 shadow-sm sm:mt-7 sm:w-[90%] sm:px-6 lg:mt-10">
      <div className="mx-auto flex min-h-10 max-w-[2048px] items-center justify-between sm:px-2 lg:px-8 xl:px-12">
        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center">
          <img
            src={Logo}
            alt="City Pulse"
            className="h-8 w-auto object-contain sm:h-9 md:h-10"
          />
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center text-sm text-black md:flex md:gap-6 lg:gap-10 xl:gap-14 xl:text-[16px]">
          <a
            href="#home"
            className="font-semibold transition-opacity hover:opacity-70"
          >
            Home
          </a>

          <a href="/about" className="transition-opacity hover:opacity-70">
            About
          </a>

          <a href="/product" className="transition-opacity hover:opacity-70">
            Product
          </a>

          <a href="/team" className="transition-opacity hover:opacity-70">
            Team
          </a>
        </div>

        {/* Desktop Contact Button */}
        <a
          href="/contact"
          className="hidden rounded-full bg-[#08a890] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#078f7b] md:block lg:px-5 lg:text-[16px]"
        >
          Contact Us
        </a>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#08a890] text-white md:hidden"
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

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-full rounded-3xl border border-gray-200 bg-white p-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-4 text-[15px] text-black">
            <a
              href="#home"
              onClick={() => setIsOpen(false)}
              className="font-semibold transition-opacity hover:opacity-70"
            >
              Home
            </a>

            <a
              href="#about"
              onClick={() => setIsOpen(false)}
              className="transition-opacity hover:opacity-70"
            >
              About
            </a>

            <a
              href="#product"
              onClick={() => setIsOpen(false)}
              className="transition-opacity hover:opacity-70"
            >
              Product
            </a>

            <a
              href="#team"
              onClick={() => setIsOpen(false)}
              className="transition-opacity hover:opacity-70"
            >
              Team
            </a>

            <a
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="mt-1 w-full rounded-full bg-[#08a890] px-5 py-2.5 text-center font-semibold text-white transition-colors hover:bg-[#078f7b]"
            >
              Contact Us
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
