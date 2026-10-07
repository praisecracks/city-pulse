import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import NavBar from "./components/shared/NavBar";
import Footer from "./components/shared/Footer";
import { trackPageview } from "./utils/analytics";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

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
