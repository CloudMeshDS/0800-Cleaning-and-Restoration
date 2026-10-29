"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { SITE } from "@/data/site";
import { SERVICES, type Service } from "@/data/services";
import { formatNZD, startingPrice } from "@/data/pricing";
import { Logo } from "./Logo";
import { ContactList, waLink, WhatsAppIcon } from "./Contact";
import { scrollToSection } from "./SmoothScroll";

/** Section links ("/#process") scroll smoothly when that section is on this page. */
const onSectionClick = (href: string, closeMenu?: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  closeMenu?.();
  if (!href.includes("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (!document.getElementById(href.split("#")[1])) return; // not on this page: let the link navigate
  e.preventDefault();
  // Let the mobile menu close (and page scrolling resume) before moving.
  if (closeMenu) window.setTimeout(() => scrollToSection(href), 80);
  else scrollToSection(href);
};

const NAV = [
  { href: "/#home-tour", label: "Home tour" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#process", label: "How it works", wide: true }, // desktop menu has room for it from xl up
];

/** "Cleaning" is every category except restoration work, which gets its own menu. */
const MENUS = [
  { label: "Cleaning", match: (s: Service) => s.categories.some((c) => c !== "restoration"), all: "/services" },
  { label: "Restoration", match: (s: Service) => s.categories.includes("restoration"), all: "/services?category=restoration" },
];

const fromPrice = (s: Service) => {
  const p = startingPrice(s.priceIds);
  return p?.amount != null ? `from ${formatNZD(p.amount)}` : "Quote";
};

/** Borderless hover / click dropdown listing services with their starting price. */
function NavMenu({ label, match, all, overHero }: (typeof MENUS)[number] & { overHero: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const items = SERVICES.filter(match);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!items.length) return null;
  const id = `menu-${label.toLowerCase()}`;
  return (
    <div ref={root} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ${overHero ? "text-white/85 hover:text-white" : "text-charcoal/75 hover:text-forest"}`}
      >
        {label}
        <ChevronDown className={`size-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {/* pt-4 bridges the gap so the menu stays open while the pointer moves down */}
      <div id={id} hidden={!open} className="absolute left-1/2 top-full w-[340px] -translate-x-1/2 pt-4">
        <ul className="rounded-2xl bg-ivory p-2 shadow-(--shadow-lux)">
          {items.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="flex items-baseline justify-between gap-4 rounded-xl px-4 py-2.5 text-sm text-forest transition-colors hover:bg-stone">
                <span>{s.name}</span>
                <span className="shrink-0 text-xs font-semibold text-charcoal/55">{fromPrice(s)}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={all} className="mt-1 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-brass hover:bg-stone">
              View all {label.toLowerCase()} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        overHero ? "bg-transparent" : "border-b border-brass/20 bg-ivory/95"
      }`}
    >
      <div className="container-x flex h-[72px] items-center justify-between">
        <Link href="/" aria-label={`${SITE.legalName} home`} className={`transition-colors duration-500 ${overHero ? "text-white" : "text-forest"}`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-8">
          {MENUS.map((m) => (
            <NavMenu key={m.label} {...m} overHero={overHero} />
          ))}
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={onSectionClick(n.href)} className={`link-line whitespace-nowrap ${n.wide ? "hidden xl:inline" : ""} text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ${overHero ? "text-white/85 hover:text-white" : "text-charcoal/75 hover:text-forest"}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href={SITE.phoneHref} aria-label={`Call ${SITE.phone}`} className={`flex items-center gap-2 text-[0.8rem] font-semibold tracking-wide transition-colors duration-500 ${overHero ? "text-white" : "text-forest"}`}>
            <Phone className="size-4" aria-hidden /> <span className="hidden whitespace-nowrap xl:inline">{SITE.phone}</span>
          </a>
          <a href={waLink(SITE.whatsappHref)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us" className={`grid size-9 place-items-center rounded-full border transition-colors hover:border-brass hover:text-brass ${overHero ? "border-white/40 text-white" : "border-forest/20 text-forest"}`}>
            <WhatsAppIcon className="size-4" />
          </a>
          <Link href="/quote" className={`${overHero ? "btn-light" : "btn-primary"} !py-2.5 !px-5 text-sm`}>
            Get a Free Quote
          </Link>
        </div>

        <button
          type="button"
          className={`-mr-2 grid size-11 place-items-center rounded-full lg:hidden ${overHero && !open ? "text-white" : "text-forest"}`}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="fixed inset-0 top-[72px] z-40 flex flex-col bg-ivory px-6 pb-10 pt-6 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col overflow-y-auto">
            {MENUS.map((m) => {
              const items = SERVICES.filter(m.match);
              return items.length ? (
                <details key={m.label} className="group border-b border-charcoal/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-serif text-3xl text-forest [&::-webkit-details-marker]:hidden">
                    {m.label}
                    <ChevronDown className="size-6 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="pb-4">
                    {items.map((s) => (
                      <li key={s.slug}>
                        <Link href={`/services/${s.slug}`} onClick={() => setOpen(false)} className="flex items-baseline justify-between gap-4 py-2 text-forest">
                          <span>{s.name}</span>
                          <span className="shrink-0 text-sm text-charcoal/55">{fromPrice(s)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null;
            })}
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={onSectionClick(n.href, () => setOpen(false))} className="border-b border-charcoal/10 py-5 font-serif text-3xl text-forest">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Link href="/quote" className="btn-primary w-full" onClick={() => setOpen(false)}>
              Get a Free Quote
            </Link>
            <div className="mb-3 border-t border-charcoal/10 pt-5">
              <p className="eyebrow mb-3">Call or WhatsApp</p>
              <ContactList />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
