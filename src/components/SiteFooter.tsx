import Link from "next/link";
import { CATEGORIES, servicesIn } from "@/data/services";
import { SITE } from "@/data/site";
import { PRICING_DISCLAIMER } from "@/data/pricing";
import { Logo } from "./Logo";
import { ContactList } from "./Contact";

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-ivory/80">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <Logo className="text-ivory" />
          <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ivory/65">{SITE.description}</p>
          <dl className="mt-8 space-y-2 text-sm">
            <div>
              <dt className="sr-only">Phone and WhatsApp</dt>
              <dd className="pb-3">
                <ContactList tone="dark" />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Email</dt>
              <dd>
                <a className="text-ivory hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Hours</dt>
              <dd className="text-ivory/55">{SITE.hours}</dd>
            </div>
          </dl>
        </div>

        <nav aria-label="Services" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div key={c.id}>
              <Link href={`/services?category=${c.id}`} className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brass transition-colors hover:text-ivory">
                {c.name}
              </Link>
              <ul className="mt-4 space-y-1 text-sm sm:space-y-2.5">
                {servicesIn(c.id)
                  .slice(0, 5)
                  .map((s) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="block py-1.5 text-ivory/65 transition hover:text-ivory sm:inline sm:py-0">
                        {s.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-x overflow-hidden" aria-hidden>
        <p className="select-none whitespace-nowrap font-serif text-[28vw] font-light leading-[0.8] tracking-[-0.05em] text-ivory/[0.06]">0800</p>
      </div>
      <div className="border-t border-brass/20">
        <div className="container-x flex flex-col gap-4 py-8 text-xs text-ivory/45 md:flex-row md:items-start md:justify-between">
          <p className="max-w-2xl leading-relaxed">{PRICING_DISCLAIMER}</p>
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <nav aria-label="Legal" className="flex gap-4 text-ivory/70">
              <Link href="/privacy" className="hover:text-ivory hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-ivory hover:underline">
                Terms &amp; Conditions
              </Link>
            </nav>
            <p>© {new Date().getFullYear()} {SITE.legalName}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
