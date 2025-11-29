import Navbar from "../components/Navbar";
import Hero from "../components/HeroSection";
import WhyFintrax from "../components/WhyFintrax";
import HowItWorks from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import CallToAction from "../components/CallToAction";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <WhyFintrax />
      <HowItWorks />
      <FAQ />
      <CallToAction />
      <Footer />
    </>
  );
}