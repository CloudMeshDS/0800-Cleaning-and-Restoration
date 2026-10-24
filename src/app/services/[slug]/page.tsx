import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { getCategory, getService, motionFor, relatedServices, SERVICES } from "@/data/services";
import { formatPrice, getPrice, PRICING_DISCLAIMER, startingPrice } from "@/data/pricing";
import { SITE } from "@/data/site";
import { PriceTable } from "@/components/PriceTable";
import { syncLive } from "@/lib/live-data";
import { ServiceMotion } from "@/components/stories/ServiceMotion";

export async function generateStaticParams() {
  await syncLive();
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await syncLive();
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  const from = startingPrice(s.priceIds);
  return {
    title: `${s.name} in New Zealand`,
    description: `${s.summary}${from ? ` Indicative pricing: ${formatPrice(from)}.` : ""}`,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: `${s.name} | ${SITE.legalName}`, description: s.summary },
  };
}

const PROCESS = ["Tell us about the job and your location", "We confirm scope, method and price", "We book a time that suits you", "Work completed and walked through with you"];

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  await syncLive();
  const { slug } = await params;
  const s = getService(slug);
  if (!s) notFound();

  const primary = getCategory(s.categories[0]);
  const related = relatedServices(s);
  const quoteHref = `/quote?service=${s.slug}`;
  const motion = motionFor(s.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    serviceType: s.name,
    provider: { "@type": "HomeAndConstructionBusiness", name: SITE.legalName, url: SITE.url },
    areaServed: { "@type": "Country", name: "New Zealand" },
    ...(s.priceIds.length && {
      offers: s.priceIds
        .map(getPrice)
        .filter((p) => p.amount !== null && p.basis !== "addon")
        .map((p) => ({ "@type": "Offer", name: p.label, priceCurrency: "NZD", price: p.amount, description: "Indicative price, subject to confirmation" })),
    }),
  };

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Services", item: `${SITE.url}/services` },
      { "@type": "ListItem", position: 2, name: primary.name, item: `${SITE.url}/services?category=${primary.id}` },
      { "@type": "ListItem", position: 3, name: s.name, item: `${SITE.url}/services/${s.slug}` },
    ],
  };

  return (
    <>
      <section className="bg-stone pb-16 pt-32 md:pb-24 md:pt-44">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-charcoal/60">
            <Link href="/services" className="inline-flex items-center gap-1 hover:text-forest">
              <ArrowLeft className="size-3.5" aria-hidden /> Services
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/services?category=${primary.id}`} className="hover:text-forest">
              {primary.name}
            </Link>
          </nav>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.6rem,6.5vw,5.6rem)] text-forest">{s.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal/75">{s.summary}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={quoteHref} className="btn-primary">
              Get a Free Quote <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href={`${quoteHref}&type=booking`} className="btn-ghost">
              Request a booking
            </Link>
          </div>
        </div>
      </section>

      {motion && <ServiceMotion kind={motion} serviceSlug={s.slug} />}

      <div className="container-x grid gap-16 py-20 lg:grid-cols-[7fr_5fr] lg:gap-24 md:py-28">
        <div>
          <h2 className="font-serif text-3xl text-forest">About this service</h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-charcoal/75">{s.description}</p>

          <h2 className="mt-14 font-serif text-3xl text-forest">What&apos;s included</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {s.includes.map((i) => (
              <li key={i} className="flex gap-3 text-charcoal/80">
                <Check className="mt-1 size-4 shrink-0 text-forest" aria-hidden /> {i}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-serif text-3xl text-forest">Good to know</h2>
          <ul className="mt-6 space-y-3">
            {s.considerations.map((c) => (
              <li key={c} className="flex gap-3 text-charcoal/75">
                <Info className="mt-1 size-4 shrink-0 text-forest/60" aria-hidden /> {c}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-serif text-3xl text-forest">How it works</h2>
          <ol className="mt-6 space-y-4">
            {PROCESS.map((p, i) => (
              <li key={p} className="flex items-baseline gap-4 border-b border-charcoal/10 pb-4">
                <span className="font-serif text-forest/50">0{i + 1}</span>
                <span className="text-charcoal/80">{p}</span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] bg-white p-7 shadow-(--shadow-soft) md:p-9">
            <p className="eyebrow">Indicative pricing</p>
            <div className="mt-5">
              <PriceTable ids={s.priceIds} />
            </div>
            <p className="mt-6 text-xs leading-relaxed text-charcoal/55">{PRICING_DISCLAIMER}</p>
            <Link href={quoteHref} className="btn-primary mt-7 w-full">
              Get an exact quote
            </Link>
            <p className="mt-4 text-center text-sm text-charcoal/60">
              Or{" "}
              <a href={SITE.phoneHref} className="font-semibold text-forest hover:underline">
                call
              </a>{" "}
              /{" "}
              <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest hover:underline">
                WhatsApp
              </a>{" "}
              {SITE.phone}
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-charcoal/10 bg-ivory py-20" aria-labelledby="related-title">
          <div className="container-x">
            <h2 id="related-title" className="font-serif text-3xl text-forest">
              Often booked alongside
            </h2>
            <ul className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-charcoal/10 md:grid-cols-3">
              {related.map((r) => {
                const from = startingPrice(r.priceIds);
                return (
                  <li key={r.slug} className="bg-ivory">
                    <Link href={`/services/${r.slug}`} className="group block h-full p-7 transition hover:bg-white">
                      <span className="font-serif text-xl text-forest group-hover:underline">{r.name}</span>
                      <span className="mt-2 block text-sm text-charcoal/65">{r.summary}</span>
                      <span className="mt-4 block text-sm font-semibold text-forest">{from ? formatPrice(from) : "Quote required"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]) }} />
    </>
  );
}
