import Starfield from "@/components/Starfield";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SkillConstellation from "@/components/SkillConstellation";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Starfield />
      <main className="relative z-10">
        <HeroSection />
        <StatsBar />
        <SkillConstellation />
        <FooterSection />
      </main>
    </div>
  );
};

export default Index;
