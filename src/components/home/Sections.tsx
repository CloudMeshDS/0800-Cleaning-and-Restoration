import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CATEGORIES, getService, servicesIn } from "@/data/services";
import { formatPrice, getPrice, PRICING_DISCLAIMER, startingPrice, type PriceId } from "@/data/pricing";

/** Stagger helper for `[data-reveal]` items. */
const rd = (i: number, step = 90) => ({ "--rd": `${i * step}ms` }) as CSSProperties;

/* ─────────────────────────────── Marquee ─────────────────────────────── */

const VALUES = ["Fabric-first methods", "Transparent pricing", "Homes & businesses", "Across Aotearoa", "Care in every detail", "One trusted team"];

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden}>
      {VALUES.map((v) => (
        <li key={v} className="flex items-center gap-10 pr-10 font-serif text-[clamp(1.6rem,3vw,2.6rem)] font-light italic text-ivory/90">
          {v}
          <span className="text-[0.6em] not-italic text-brass">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Our values" className="overflow-hidden border-y border-brass/25 bg-forest-deep py-7 md:py-9">
      <div className="animate-marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

/* ───────────────────────── Catalogue index ───────────────────────── */

export function CatalogueIndex() {
  return (
    <section className="bg-ivory py-28 md:py-40" aria-labelledby="catalogue-title">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
          <div data-reveal>
            <p className="eyebrow">The full catalogue</p>
            <h2 id="catalogue-title" className="display mt-5 text-[clamp(2.6rem,5.4vw,5rem)] text-forest">
              Every surface.
              <br />
              <em className="font-normal italic">One trusted team.</em>
            </h2>
          </div>
          <p data-reveal style={rd(1)} className="max-w-md text-[1.05rem] leading-relaxed text-charcoal/70 md:justify-self-end">
            Over fifty services across seven disciplines – each with clear scope notes and indicative pricing you can see before you ask.
          </p>
        </div>

        <ul className="mt-20 border-t border-charcoal/10">
          {CATEGORIES.map((c, i) => {
            const items = servicesIn(c.id);
            const from = startingPrice(items.flatMap((s) => s.priceIds));
            return (
              <li key={c.id} data-reveal style={rd(i, 70)} className="group/row relative border-b border-charcoal/10">
                <span className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-brass transition-transform duration-700 ease-(--ease-lux) group-hover/row:scale-x-100" aria-hidden />
                <Link href={`/services?category=${c.id}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-6 gap-y-1 py-7 md:grid-cols-[70px_1.2fr_1.5fr_170px_40px] md:py-10">
                  <span className="num text-base">0{i + 1}</span>
                  <span className="font-serif text-2xl font-light text-forest transition-transform duration-700 ease-(--ease-soft) group-hover:translate-x-3 md:text-[2.2rem]">{c.name}</span>
                  <ArrowUpRight className="size-5 text-forest/40 transition duration-500 group-hover:rotate-45 group-hover:text-brass md:order-last" aria-hidden />
                  <span className="col-span-3 text-sm text-charcoal/60 md:col-span-1">
                    {c.blurb} <span className="text-charcoal/40">· {items.length} services</span>
                  </span>
                  <span className="col-span-3 text-sm font-semibold tracking-wide text-forest md:col-span-1 md:text-right">
                    {from ? `${from.basis === "from" ? "" : "From "}${formatPrice(from)}` : "Quoted on assessment"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Process ─────────────────────────────── */

const STEPS = [
  { title: "Tell us about your space", body: "Choose services, share a few details and photos if you have them." },
  { title: "See indicative pricing", body: "Published rates up front. We confirm the final price once we understand the job." },
  { title: "Confirm a time", body: "We check availability in your area and lock in a time that works." },
  { title: "Care, delivered", body: "Methods matched to every surface, with a walkthrough when we're done." },
];

export function Process() {
  return (
    <section id="process" className="scroll-mt-20 bg-stone py-28 md:py-36" aria-labelledby="process-title">
      <div className="container-x">
        <div data-reveal>
          <p className="eyebrow">How it works</p>
          <h2 id="process-title" className="display mt-5 max-w-3xl text-[clamp(2.4rem,4.6vw,4.2rem)] text-forest">
            Straightforward, from first message <em className="font-normal italic">to final walkthrough.</em>
          </h2>
        </div>
        <ol className="mt-20 grid gap-12 md:grid-cols-4 md:gap-10">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={rd(i, 120)} className="relative border-t border-forest/15 pt-8">
              <span className="absolute -top-px left-0 h-px w-14 bg-brass" />
              <p className="num text-5xl font-light">0{i + 1}</p>
              <h3 className="mt-6 text-lg font-semibold text-forest">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-charcoal/65">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── Pricing highlights ───────────────────────── */

const HIGHLIGHTS: { slug: string; price: PriceId }[] = [
  { slug: "curtain-care", price: "curtainSmall" },
  { slug: "carpet-deep-refresh", price: "carpetResidential" },
  { slug: "sofa-upholstery-refresh", price: "upholsterySeat" },
  { slug: "glass-care", price: "window12" },
  { slug: "move-out-detail", price: "endOfTenancy" },
  { slug: "oven-revive", price: "oven" },
];

export function PricingHighlights() {
  return (
    <section className="bg-ivory py-28 md:py-36" aria-labelledby="pricing-title">
      <div className="container-x grid gap-16 lg:grid-cols-[5fr_7fr]">
        <div data-reveal>
          <p className="eyebrow">Transparent pricing</p>
          <h2 id="pricing-title" className="display mt-5 text-[clamp(2.4rem,4.6vw,4.2rem)] text-forest">
            Know where you stand <em className="font-normal italic">before you ask.</em>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-charcoal/70">{PRICING_DISCLAIMER}</p>
          <Link href="/pricing" className="btn-ghost mt-10">
            All indicative prices <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <dl className="border-t border-charcoal/10">
          {HIGHLIGHTS.filter((h) => getService(h.slug)).map((h, i) => {
            const s = getService(h.slug)!; // hidden or deleted services are skipped above
            const p = getPrice(h.price);
            return (
              <div key={h.slug} data-reveal style={rd(i, 70)} className="flex items-baseline justify-between gap-6 border-b border-charcoal/10 py-6">
                <dt>
                  <Link href={`/services/${s.slug}`} className="link-line font-serif text-xl font-light text-forest md:text-[1.7rem]">
                    {s.name}
                  </Link>
                  <span className="mt-1 block text-sm text-charcoal/55">{p.label}</span>
                </dt>
                <dd className="shrink-0 text-right font-semibold tracking-wide text-forest">{formatPrice(p)}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Final CTA ─────────────────────────────── */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-forest py-32 text-ivory md:py-48" aria-labelledby="cta-title">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[720px] rounded-full bg-[radial-gradient(closest-side,rgb(176_141_87/0.18),transparent)]" />
      <div className="pointer-events-none absolute -bottom-60 -left-40 size-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(168_184_165/0.14),transparent)]" />
      <div className="container-x relative text-center" data-reveal>
        <p className="eyebrow justify-center !text-sage">Free, no-obligation quote</p>
        <h2 id="cta-title" className="display mx-auto mt-6 max-w-4xl text-[clamp(2.8rem,6.6vw,6rem)]">
          Ready for a space that <em className="font-normal italic text-brass-soft">feels new again?</em>
        </h2>
        <p className="mx-auto mt-7 max-w-lg text-ivory/70">Tell us what you need. We&apos;ll come back with clear pricing and available times in your area.</p>
        <div className="mx-auto mt-12 flex max-w-xs flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
          <Link href="/quote" className="btn-light">
            Get a Free Quote <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/quote?type=booking" className="btn border border-ivory/30 text-ivory before:bg-ivory/10">
            Request a booking
          </Link>
        </div>
      </div>
    </section>
  );
}
