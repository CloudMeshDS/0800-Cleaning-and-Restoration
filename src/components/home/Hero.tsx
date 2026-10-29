"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, MQ } from "@/lib/gsap";
import { PHOTOS } from "@/data/photos";
import { PhotoImg } from "../photo/DirtyPhoto";

/**
 * Full-screen photographic hero with a slow cinematic push-in. Scrolling
 * carries the camera forward into the fly-through below.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        gsap.fromTo("[data-hero-kb]", { scale: 1.14, xPercent: 1.5 }, { scale: 1.02, xPercent: 0, duration: 10, ease: "sine.out" });

        // Scroll: the camera pushes in towards the front of the house.
        gsap.to("[data-hero-cam]", {
          scale: 1.25,
          yPercent: 4,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.8 },
        });
      });

    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-charcoal" aria-labelledby="hero-title">
      <div data-hero-cam className="absolute inset-0 origin-[60%_60%] will-change-transform">
        <div data-hero-kb className="absolute inset-0 will-change-transform">
          <PhotoImg photo={PHOTOS.hero} priority />
        </div>
      </div>

      {/* Legibility scrims */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/50 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/25 md:to-transparent md:to-[70%]" aria-hidden />

      {/* Copy */}
      <div className="container-x relative flex h-full flex-col justify-end pb-20 md:justify-center md:pb-0">
        <div className="max-w-[640px]">
          <p className="rise eyebrow !text-white/85" style={{ "--d": "0.15s" } as React.CSSProperties}>
            Property care · Aotearoa <span className="sm:hidden">NZ</span>
            <span className="hidden sm:inline">New Zealand</span>
          </p>
          <h1 id="hero-title" className="display rise mt-5 text-[clamp(2.6rem,6.6vw,6rem)] text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.35)]" style={{ "--d": "0.3s" } as React.CSSProperties}>
            Clean Spaces.
            <br />
            <em className="font-normal italic text-brass-soft">Extraordinary</em> Living.
          </h1>
          <p className="rise mt-5 max-w-md text-base leading-relaxed text-white/85 sm:mt-7 sm:text-lg" style={{ "--d": "0.55s" } as React.CSSProperties}>
            Professional cleaning and property care for homes and businesses across New Zealand.
          </p>
          <div className="rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ "--d": "0.75s" } as React.CSSProperties}>
            <Link href="/quote" className="btn-light">
              Get a Free Quote <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/services" className="btn border border-white/40 text-white before:bg-white/15">
              Explore Our Services
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#catalogue"
        className="rise absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-white/70 md:flex"
        style={{ "--d": "1.2s" } as React.CSSProperties}
      >
        Scroll to explore
        <span className="relative block h-10 w-px overflow-hidden bg-white/25">
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-white" />
        </span>
      </a>
    </section>
  );
}
