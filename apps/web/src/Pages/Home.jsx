import HeroSection from "../components/home/HeroSection";
import LaunchBanner from "../components/home/LaunchBanner";
import StatsSection from "../components/home/StatsSection";
import Howitworkssection from "../components/home/Howitworkssection";
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
      <Howitworkssection />
      {/* <EverydayNeedsSection /> */}
      {/* <MerchantSection onOpenModal={() => setMerchantModalOpen(true)} /> */}
      {/* <WaitlistSection /> */}
      {/* <MerchantModal
        open={merchantModalOpen}
        onClose={() => setMerchantModalOpen(false)}
      /> */}
    </>
  );
}
