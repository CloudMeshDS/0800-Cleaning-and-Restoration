import type { Metadata } from "next";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { syncLive } from "@/lib/live-data";
import { CATEGORIES, getService, type CategoryId } from "@/data/services";

export const metadata: Metadata = {
  title: "Get a Free Quote",
  description: "Request a free, no-obligation quote or booking for cleaning and property care in New Zealand. See an indicative estimate instantly.",
  alternates: { canonical: "/quote" },
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ service?: string | string[]; type?: string; category?: string }> }) {
  await syncLive();
  const sp = await searchParams;
  const raw = Array.isArray(sp.service) ? sp.service : sp.service ? [sp.service] : [];
  const services = raw.filter((s) => getService(s));
  const type = sp.type === "booking" ? "booking" : "quote";
  const category = CATEGORIES.some((c) => c.id === sp.category) ? (sp.category as CategoryId) : undefined;

  return (
    <div className="container-x pb-28 pt-36 md:pt-44">
      <p className="eyebrow">Free, no-obligation</p>
      <h1 className="display mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5rem)] text-forest">Let&apos;s talk about your space.</h1>
      <p className="mt-6 max-w-xl text-charcoal/65">Three short steps. You&apos;ll see an indicative estimate as you go, and we&apos;ll confirm the final price once we understand the job.</p>
      <div className="mt-14">
        <QuoteForm key={`${services.join(",")}-${type}`} initialServices={services} initialType={type} initialCategory={category} />
      </div>
    </div>
  );
}
