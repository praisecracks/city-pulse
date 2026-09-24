// import HeroSection from "../components/home/HeroSection";
// import LaunchBanner from "../components/home/LaunchBanner";
// import CategoriesGrid from "../components/home/CategoriesGrid";
// import StatsSection from "../components/home/Statssection";
// import HowItWorksSection from "../components/home/HowItWorksSection";
// // import EverydayNeedsSection from "../components/home/EverydayNeedsSection";
// import MerchantSection from "../components/home/MerchantSection";
// import MerchantModal from "../components/home/MerchantModal";
// import WaitlistSection from "../components/home/WaitlistSection";

// // W1 — Home (PRD Section 6).
// // Order follows the spec: hero hook → trust/launch signal → how it works →
// // categories at a glance. Swap LaunchBanner's status to "live" post-launch.
// export default function Home() {
//   return (
//     <>
//       {/* <Hero /> */}
//       <HeroSection />
//       <StatsSection />
//       <HowItWorksSection />
//       {/* <EverydayNeedsSection /> */}
//       <MerchantSection />
//       <MerchantModal />
//       <LaunchBanner status="comingSoon" />
//       <WaitlistSection />
//       <CategoriesGrid />
//     </>
//   );
// }

import { useState } from "react";
import HeroSection from "../components/home/HeroSection";
import LaunchBanner from "../components/home/LaunchBanner";
import StatsSection from "../components/home/StatsSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
// import EverydayNeedsSection from "../components/home/EverydayNeedsSection";
// import MerchantSection from "../components/home/MerchantSection";
// import MerchantModal from "../components/home/MerchantModal";
import WaitlistSection from "../components/home/WaitlistSection";

// W1 — Home (PRD Section 6).
// WaitlistSection (id="waitlist-section") must be rendered here for any
// #waitlist-section anchor link, anywhere on this page, to actually scroll
// to something. MerchantModal's open state lives here since MerchantSection
// only triggers it — it doesn't render it.
export default function Home() {
  // const [merchantModalOpen, setMerchantModalOpen] = useState(false);

  return (
    <>
      <HeroSection />
      <LaunchBanner />
      <StatsSection />
      <HowItWorksSection />
      {/* <EverydayNeedsSection /> */}
      {/* <MerchantSection onOpenModal={() => setMerchantModalOpen(true)} /> */}
      <WaitlistSection />
      {/* <MerchantModal
        open={merchantModalOpen}
        onClose={() => setMerchantModalOpen(false)}
      /> */}
    </>
  );
}
