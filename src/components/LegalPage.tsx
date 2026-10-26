import Link from "next/link";
import type { ReactNode } from "react";

/** Shared layout for the Privacy Policy and Terms & Conditions pages. */
export function LegalPage({ eyebrow, title, updated, intro, children }: { eyebrow: string; title: string; updated: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="pb-28 pt-36 md:pt-44">
      <div className="container-x max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,5vw,4rem)] text-forest">{title}</h1>
        <p className="mt-3 text-sm text-charcoal/50">Last updated {updated}</p>
        <div className="mt-8 text-[1.02rem] leading-relaxed text-charcoal/75">{intro}</div>
        <div className="legal mt-12 space-y-10 text-[0.98rem] leading-relaxed text-charcoal/75 [&_a]:font-semibold [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-forest [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-16 border-t border-charcoal/10 pt-6 text-sm text-charcoal/55">
          See also: <Link href="/privacy" className="font-semibold text-forest underline underline-offset-2">Privacy Policy</Link> ·{" "}
          <Link href="/terms" className="font-semibold text-forest underline underline-offset-2">Terms &amp; Conditions</Link>
        </p>
      </div>
    </div>
  );
}
