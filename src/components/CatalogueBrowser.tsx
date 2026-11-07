"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { SERVICE_GROUPS, SERVICES, type GroupId } from "@/data/services";
import { formatPrice, startingPrice } from "@/data/pricing";

/** Tabs match the header menus (see SERVICE_GROUPS); a service can be in more than one. */
export function CatalogueBrowser({ initialTab }: { initialTab: GroupId | "all" }) {
  const [tab, setTab] = useState<GroupId | "all">(initialTab);
  const [query, setQuery] = useState("");

  const select = (t: GroupId | "all") => {
    setTab(t);
    const url = t === "all" ? "/services" : `/services?tab=${t}`;
    window.history.replaceState(null, "", url);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const group = SERVICE_GROUPS.find((g) => g.id === tab);
    return (group ? group.list(SERVICES) : SERVICES).filter((s) => !q || [s.name, s.summary, ...s.keywords].join(" ").toLowerCase().includes(q));
  }, [tab, query]);

  return (
    <div>
      <div className="sticky top-[72px] z-20 -mx-5 border-b border-charcoal/10 bg-ivory/95 px-5 py-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" aria-hidden />
            <label htmlFor="svc-search" className="sr-only">
              Search services
            </label>
            <input id="svc-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search e.g. curtains, bond clean, mould" className="field !rounded-full !pl-11" />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-charcoal/50 hover:bg-stone" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div role="tablist" aria-label="Filter services" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {[{ id: "all" as const, label: "All services" }, ...SERVICE_GROUPS].map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => select(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  tab === c.id ? "border-forest bg-forest text-ivory" : "border-charcoal/15 text-charcoal/70 hover:border-forest/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-charcoal/55" aria-live="polite">
        {results.length} {results.length === 1 ? "service" : "services"}
      </p>

      {results.length ? (
        <ul className="mt-4 grid border-t border-charcoal/10 md:grid-cols-2">
          {results.map((s) => {
            const from = startingPrice(s.priceIds);
            return (
              <li key={s.slug} className="border-b border-charcoal/10 md:odd:border-r md:odd:pr-8 md:even:pl-8">
                <Link href={`/services/${s.slug}`} className="group flex h-full items-start justify-between gap-6 py-7">
                  <span>
                    <span className="block font-serif text-2xl text-forest">{s.name}</span>
                    <span className="mt-2 block text-[0.95rem] leading-relaxed text-charcoal/65">{s.summary}</span>
                    <span className="mt-3 block text-sm font-semibold text-forest">{from ? formatPrice(from) : "Quote required"}</span>
                  </span>
                  <ArrowUpRight className="mt-1 size-5 shrink-0 text-forest/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-10 rounded-3xl bg-stone p-10 text-center">
          <p className="font-serif text-2xl text-forest">Nothing matches that just yet.</p>
          <p className="mt-2 text-charcoal/65">Tell us what you need and we&apos;ll let you know if we can help.</p>
          <Link href="/quote" className="btn-primary mt-6">
            Ask us directly
          </Link>
        </div>
      )}
    </div>
  );
}
