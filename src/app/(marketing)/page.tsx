import { ClosingCta } from "@/components/marketing/landing/ClosingCta";
import { ForGrowers } from "@/components/marketing/landing/ForGrowers";
import { ForRestaurants } from "@/components/marketing/landing/ForRestaurants";
import { Hero } from "@/components/marketing/landing/Hero";
import { HowItWorks } from "@/components/marketing/landing/HowItWorks";
import { SystemFacts } from "@/components/marketing/landing/SystemFacts";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ForGrowers />
      <ForRestaurants />
      <SystemFacts />
      <ClosingCta />
    </>
  );
}
