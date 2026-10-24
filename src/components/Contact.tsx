"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone, X } from "lucide-react";
import { PHONES } from "@/data/site";

const GREETING = encodeURIComponent("Hi 0800 Cleaning & Restoration, I'd like to ask about a quote.");
export const waLink = (base: string) => `${base}?text=${GREETING}`;

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

/** Both numbers, each with Call and WhatsApp actions. */
export function ContactList({ tone = "light" }: { tone?: "light" | "dark" }) {
  const sub = tone === "dark" ? "text-ivory/55 hover:text-ivory" : "text-charcoal/60 hover:text-forest";
  const main = tone === "dark" ? "text-ivory" : "text-forest";
  return (
    <ul className="space-y-3">
      {PHONES.map((p) => (
        <li key={p.display}>
          <a href={p.tel} className={`link-line font-serif text-lg ${main}`}>
            {p.display}
          </a>
          <span className="mt-1 flex gap-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
            <a href={p.tel} className={`flex items-center gap-1.5 transition-colors ${sub}`}>
              <Phone className="size-3" aria-hidden /> Call
            </a>
            <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 transition-colors ${sub}`}>
              <WhatsAppIcon className="size-3.5" /> WhatsApp
            </a>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Floating call / WhatsApp launcher, bottom-right on every page. */
export function FloatingContact() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (pathname.startsWith("/quote")) return null;

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <div
        id="contact-panel"
        role="dialog"
        aria-label="Call or WhatsApp us"
        className={`w-[min(18rem,calc(100vw-2.5rem))] origin-bottom-right rounded-[22px] border border-brass/25 bg-ivory p-5 shadow-(--shadow-lux) transition-[opacity,transform] duration-500 ease-(--ease-soft) ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <p className="eyebrow">Talk to us</p>
        <p className="mt-2 text-sm text-charcoal/65">Call or WhatsApp either number.</p>
        <div className="mt-4">
          <ContactList />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="contact-panel"
        aria-label={open ? "Close contact options" : "Call or WhatsApp us"}
        className="grid size-14 place-items-center rounded-full bg-forest text-ivory shadow-(--shadow-lux) ring-1 ring-brass/40 transition-transform duration-500 ease-(--ease-soft) hover:scale-105"
      >
        {open ? <X className="size-5" /> : <WhatsAppIcon className="size-6" />}
      </button>
    </div>
  );
}
