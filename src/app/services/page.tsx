import type { Metadata } from "next";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { syncLive } from "@/lib/live-data";

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
      <CatalogueBrowser />
    </div>
  );
}
