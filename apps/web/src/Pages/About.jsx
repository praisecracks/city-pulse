import ProductHero from "../components/About/Producthero";
import ScarcityStories from "../components/About/Scarcitystories";
import ParadigmShift from "../components/About/Paradigmshift";
import CategoriesDeepDive from "../components/About/Categoriesdeepdive";
import ProductCTABanner from "../components/About/Productctabanner";

const About = () => {
  return (
    <div>
      <ProductHero />
      <ScarcityStories />
      <ParadigmShift />
      <CategoriesDeepDive />
      {/* <TrustEngine /> */}
      <ProductCTABanner />
    </div>
  );
};

export default About;