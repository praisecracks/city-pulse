import Logo from "../../assets/Logo.png";

const NavBar = () => {
  return (
    <nav className="w-[90%] rounded-full border border-gray-200    px-6 py-3 mt-10 mb-3 mx-auto shadow-sm">
      <div className="mx-auto flex h-10 max-w-[2048px] items-center justify-between px-12">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src={Logo}
            alt="City Pulse"
            className="h-[40px] w-auto object-contain"
          />
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-14 text-[16px] text-black">
          <a
            href="#home"
            className="font-semibold transition-opacity hover:opacity-70"
          >
            Home
          </a>

          <a href="#about" className="transition-opacity hover:opacity-70">
            About
          </a>

          <a href="#product" className="transition-opacity hover:opacity-70">
            Product
          </a>

          <a href="#team" className="transition-opacity hover:opacity-70">
            Team
          </a>
        </div>

        {/* Contact Button */}
        <a
          href="#contact"
          className="rounded-full bg-[#08a890] px-5 py-1 text-[16px] font-semibold text-white transition-colors hover:bg-[#078f7b]"
        >
          Contact Us
        </a>
      </div>
    </nav>
  );
};

export default NavBar;
