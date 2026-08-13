import { Hero } from "@/components/home/Hero";
import { ThemeReveal } from "@/components/home/ThemeReveal";
import { Steps } from "@/components/home/Steps";
import { AboutSection } from "@/components/home/About";
import { JudgingCriteria } from "@/components/home/JudgingCriteria";
import { Partners } from "@/components/home/Partners";

export default function Home() {
  return (
    <>
      <Hero />
      {/* Renders only from the theme announcement onward — see ThemeReveal. */}
      <ThemeReveal />
      <Steps />
      <AboutSection />
      <JudgingCriteria />
      <Partners />
    </>
  );
}
