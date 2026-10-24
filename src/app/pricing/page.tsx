import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, servicesIn } from "@/data/services";
import { PRICES_REVIEWED, PRICING_DISCLAIMER } from "@/data/pricing";
import { syncLive } from "@/lib/live-data";
import { PriceTable } from "@/components/PriceTable";

export const metadata: Metadata = {
  title: "Indicative Pricing",
  description: "Indicative NZD pricing for carpet, curtain, blind, upholstery, home, commercial, window, oven, floor and restoration services in New Zealand.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  await syncLive();
  return (
    <div className="pb-28 pt-36 md:pt-44">
      <div className="container-x">
        <p className="eyebrow">Pricing</p>
        <h1 className="display mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5rem)] text-forest">Clear, indicative pricing.</h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-charcoal/70">{PRICING_DISCLAIMER}</p>
        <p className="mt-3 text-xs text-charcoal/45">Rates last reviewed {new Date(PRICES_REVIEWED).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}.</p>

        <nav aria-label="Jump to category" className="mt-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="rounded-full border border-charcoal/15 px-4 py-2 text-sm text-charcoal/75 hover:border-forest hover:text-forest">
              {c.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-x mt-16 space-y-24">
        {CATEGORIES.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-28" aria-labelledby={`${c.id}-h`}>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-forest pb-5">
              <h2 id={`${c.id}-h`} className="font-serif text-3xl text-forest md:text-4xl">
                {c.name}
              </h2>
              <p className="text-sm text-charcoal/55">{c.blurb}</p>
            </div>
            <div className="grid gap-x-16 md:grid-cols-2">
              {servicesIn(c.id).map((s) => (
                <div key={s.slug} className="border-b border-charcoal/10 py-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-semibold text-forest">{s.name}</h3>
                    <Link href={`/quote?service=${s.slug}`} className="shrink-0 text-sm font-semibold text-forest/70 underline-offset-4 hover:text-forest hover:underline">
                      Quote
                    </Link>
                  </div>
                  <div className="mt-3">
                    <PriceTable ids={s.priceIds} compact />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
