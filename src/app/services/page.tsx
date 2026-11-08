import type { Metadata } from "next";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { syncLive } from "@/lib/live-data";
import { PRICING_DISCLAIMER } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Services",
  description: "Cleaning, restoration and floor services across New Zealand – carpets, curtains, blinds, upholstery, homes, workplaces, windows, ovens, flood, mould, meth, tiles and vinyl – with indicative pricing.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  await syncLive();
  await searchParams; // the tab is read from the address in CatalogueBrowser; this keeps the page rendered per request

  return (
    <div className="container-x pb-28 pt-36 md:pt-44">
      <p className="eyebrow">Services</p>
      <h1 className="display mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5rem)] text-forest">Everything your property needs, explained clearly.</h1>
      <p className="mt-6 max-w-2xl text-charcoal/65">{PRICING_DISCLAIMER} Service availability varies by region and is confirmed when you enquire.</p>
      <div className="mt-14">
        <CatalogueBrowser />
      </div>
    </div>
  );
}
