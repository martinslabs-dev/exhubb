import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import DualModeSwitcher from "@/components/sections/DualModeSwitcher";
import TodaysDeals from "@/components/sections/TodaysDeals";
import FeaturedServices from "@/components/sections/FeaturedServices";
import HowItWorks from "@/components/sections/HowItWorks";
import AIFeature from "@/components/sections/AIFeature";
import TopSellers from "@/components/sections/TopSellers";
import BecomeASeller from "@/components/sections/BecomeASeller";
import Testimonials from "@/components/sections/Testimonials";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustBar />
      <DualModeSwitcher />
      <TodaysDeals />
      <FeaturedServices />
      <HowItWorks />
      <AIFeature />
      <TopSellers />
      <BecomeASeller />
      <Testimonials />
      <Footer />
    </main>
  );
}
