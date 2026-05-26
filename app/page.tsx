import { Hero } from "@/components/home/Hero";
import { Steps } from "@/components/home/Steps";
import { AboutSection } from "@/components/home/About";
import { JudgingCriteria } from "@/components/home/JudgingCriteria";
import { Partners } from "@/components/home/Partners";

export default function Home() {
  return (
    <>
      <Hero />
      <Steps />
      <AboutSection />
      <JudgingCriteria />
      <Partners />
    </>
  );
}
