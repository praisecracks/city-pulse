import { Outlet } from "react-router-dom";
import NavBar from "./components/shared/NavBar";
import Footer from "./components/shared/Footer";

// PRD Section 5: footer repeats the same six links as the header nav.
// NOTE: this duplicates NAV_LINKS in NavBar.jsx — worth extracting both
// to a single src/data/nav.js once the site has more than these two spots.
// const FOOTER_LINKS = [
//   { label: "Home", to: "/" },
//   { label: "About the Product", to: "/about/product" },
//   { label: "About the Company", to: "/about/company" },
//   { label: "The Builders", to: "/team" },
//   { label: "Download & How to Use", to: "/download" },
//   { label: "Contact Us", to: "/contact" },
// ];

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE]">
      <NavBar />

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
