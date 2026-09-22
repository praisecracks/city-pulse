import Hero from "../components/home/hero";
import LaunchBanner from "../components/home/LaunchBanner";
import HowItWorks from "../components/home/HowItWorks";
import CategoriesGrid from "../components/home/CategoriesGrid";

// W1 — Home (PRD Section 6).
// Order follows the spec: hero hook → trust/launch signal → how it works →
// categories at a glance. Swap LaunchBanner's status to "live" post-launch.
export default function Home() {
  return (
    <>
      <Hero />
      <LaunchBanner status="comingSoon" />
      <HowItWorks />
      <CategoriesGrid />
    </>
  );
}
