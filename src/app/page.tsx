import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen canvas-grid">
      <Navbar />
      <main className="flex-1 pt-32 pb-24">
        <Hero />
        <HowItWorks />
        <Features />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
