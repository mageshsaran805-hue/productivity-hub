import { Navbar, HeroSection, FeaturesSection, TestimonialsSection, FAQSection, CTASection, Footer } from "@/components/landing";
import { AnimatedBackground } from "@/components/animations/animated-background";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <AnimatedBackground variant="landing" />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
