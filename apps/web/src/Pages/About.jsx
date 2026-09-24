import ProductHero from "../components/About/Producthero";
import ScarcityStories from "../components/About/Scarcitystories";
import ParadigmShift from "../components/About/Paradigmshift";
import CategoriesDeepDive from "../components/About/Categoriesdeepdive";
import TrustEngine from "../components/About/Trustengine";
import RoadmapSection from "../components/About/Roadmapsection";
import ProductCTABanner from "../components/About/Productctabanner";

const About = () => {
  return (
    <div>
      <ProductHero />
      <ScarcityStories />
      <ParadigmShift />
      <CategoriesDeepDive />
      <TrustEngine />
      <RoadmapSection />
      <ProductCTABanner />
    </div>
  );
};

export default About;
