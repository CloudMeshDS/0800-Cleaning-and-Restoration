import { Hero } from "@/components/home/Hero";
import { Walkthrough } from "@/components/walkthrough/Walkthrough";
import { syncLive } from "@/lib/live-data";
import { CatalogueIndex, FinalCta, Marquee, PricingHighlights, Process } from "@/components/home/Sections";

export default async function HomePage() {
  await syncLive();
  return (
    <>
      <Hero />
      <Walkthrough />
      <Marquee />
      <CatalogueIndex />
      <PricingHighlights />
      <Process />
      <FinalCta />
    </>
  );
}
