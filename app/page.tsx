import { Hero } from "@/components/home/Hero";
import { ThemeReveal } from "@/components/home/ThemeReveal";
import { TopGames } from "@/components/home/TopGames";
import { NextEdition } from "@/components/home/NextEdition";
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
      {/* Final standings — also gated on the premiere. */}
      <TopGames />
      {/* Save-the-date — renders only after the results premiere. */}
      <NextEdition />
      <Steps />
      <AboutSection />
      <JudgingCriteria />
      <Partners />
    </>
  );
}
