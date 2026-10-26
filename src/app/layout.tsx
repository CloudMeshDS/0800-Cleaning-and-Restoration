import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/data/site";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Reveals } from "@/components/Reveals";
import { Cursor } from "@/components/Cursor";
import { Logo } from "@/components/Logo";
import { FloatingContact } from "@/components/Contact";
import { LiveSync } from "@/components/LiveSync";
import { syncLive } from "@/lib/live-data";
import { jsonLd } from "@/lib/json-ld";
import type { PriceTable } from "@/data/pricing";
import { PHONES } from "@/data/site";

/** Runs before paint: marks JS as available and plays the intro once per session. */
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");try{if(sessionStorage.getItem("cr-intro")){return}sessionStorage.setItem("cr-intro","1");if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("intro")}catch(e){}})();`;

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.legalName} | Cleaning & Property Care in New Zealand`, template: `%s | ${SITE.legalName}` },
  description: SITE.description,
  openGraph: { type: "website", locale: "en_NZ", siteName: SITE.legalName, title: SITE.tagline, description: SITE.description },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#173D35", width: "device-width", initialScale: 1 };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: SITE.legalName,
  url: SITE.url,
  telephone: PHONES.map((p) => p.display),
  email: SITE.email,
  areaServed: { "@type": "Country", name: "New Zealand" },
  description: SITE.description,
};

/** Pages refresh prices at least every 5 minutes (instantly when saved in /admin). */
export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { table, catalogue } = await syncLive();
  // Internal "uncertain" notes never leave the server.
  const publicTable = Object.fromEntries(Object.entries(table).map(([id, { uncertain: _, ...item }]) => [id, item])) as PriceTable;
  return (
    <html lang="en-NZ" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-screen">
        <LiveSync table={publicTable} catalogue={catalogue} />
        <div id="intro" aria-hidden>
          <div className="intro-mark flex flex-col items-center gap-5">
            <Logo className="scale-150 text-ivory" />
            <span className="intro-line block h-px w-40 bg-brass" />
          </div>
        </div>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-5 focus:py-3 focus:text-ivory">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <SmoothScroll />
        <Reveals />
        <Cursor />
        <FloatingContact />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgJsonLd) }} />
      </body>
    </html>
  );
}
