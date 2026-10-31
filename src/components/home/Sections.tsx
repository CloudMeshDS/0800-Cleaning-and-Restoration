import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, getService, SERVICE_GROUPS, SERVICES, type Service } from "@/data/services";
import { cardSrcSet, FALLBACK_SERVICE_PHOTO, photoUrl, SERVICE_PHOTOS } from "@/data/photos";
import { formatNZD, formatPrice, getPrice, PRICING_DISCLAIMER, startingPrice, type PriceId } from "@/data/pricing";

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
    <section id="catalogue" className="scroll-mt-20 bg-ivory py-28 md:py-40" aria-labelledby="catalogue-title">
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
            {SERVICES.length} services across {CATEGORIES.length} categories – each with clear scope notes and indicative pricing you can see before you ask.
          </p>
        </div>

        {SERVICE_GROUPS.map((g) => {
          const items = SERVICES.filter(g.match);
          if (!items.length) return null;
          return (
            <div key={g.label} className="mt-16 md:mt-20">
              <div data-reveal className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-2xl font-light text-forest md:text-3xl">{g.title}</h3>
                <Link href={g.all} className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-forest shadow-(--shadow-lux) transition-colors hover:text-brass">
                  View all
                </Link>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
                {items.map((s, i) => (
                  <li key={s.slug} data-reveal style={rd(i, 50)}>
                    <ServiceCard service={s} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const photo = SERVICE_PHOTOS[service.slug] ?? FALLBACK_SERVICE_PHOTO;
  const from = startingPrice(service.priceIds);
  return (
    <Link href={`/services/${service.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest-deep shadow-(--shadow-lux)">
      {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted images with a responsive srcset */}
      <img
        src={photoUrl(photo.id, 640)}
        srcSet={cardSrcSet(photo.id)}
        sizes="(min-width: 1024px) 25vw, 50vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-(--ease-soft) group-hover:scale-105"
        style={{ objectPosition: photo.position ?? "50% 50%" }}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15" aria-hidden />
      <span className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white">
        <span className="text-[0.95rem] font-semibold leading-snug drop-shadow-[0_1px_8px_rgb(0_0_0/0.5)] md:text-lg">{service.name}</span>
        <span className="mt-1 text-xs font-semibold text-white/85 md:text-sm">{from?.amount != null ? `from ${formatNZD(from.amount)}` : "Quoted on assessment"}</span>
      </span>
    </Link>
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
