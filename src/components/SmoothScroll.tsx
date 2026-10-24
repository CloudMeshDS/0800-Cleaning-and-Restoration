"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Inertial smooth scrolling. Mouse-wheel notches and trackpad flicks become one
 * continuous, eased glide, driven by GSAP's ticker so ScrollTrigger scenes
 * update on the exact same frame as the scroll position. Native scrolling is
 * kept (scrollbar, keyboard, find-in-page all work); touch devices keep their
 * own momentum scrolling. Disabled for people who prefer reduced motion.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.6, anchors: { offset: -72 }, autoRaf: false });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // New page: start at the top, or at the #anchor the link pointed to.
  // Pinned scroll scenes (e.g. the home tour) add thousands of pixels of scroll
  // space once they initialise, so an anchor's position is only final after
  // ScrollTrigger has refreshed – jump there, then re-aim after each refresh
  // until the layout settles.
  useEffect(() => {
    const hash = window.location.hash;
    const target = () => (hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);
    const go = () => {
      const el = target();
      const lenis = window.__lenis;
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -72, immediate: true, force: true });
        else window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72);
      } else if (!hash) {
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);
      }
    };

    let frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      go();
    });
    if (!hash) return () => cancelAnimationFrame(frame);

    ScrollTrigger.addEventListener("refresh", go);
    const timers = [250, 700, 1400].map((ms) => window.setTimeout(go, ms));
    const stop = window.setTimeout(() => ScrollTrigger.removeEventListener("refresh", go), 1600);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      clearTimeout(stop);
      ScrollTrigger.removeEventListener("refresh", go);
    };
  }, [pathname]);

  return null;
}

/**
 * Smooth-scroll to an in-page section (e.g. "#process"). Returns false when the
 * section isn't on the current page, so the caller can navigate there instead.
 */
export function scrollToSection(hash: string): boolean {
  const el = document.getElementById(hash.replace(/^.*#/, ""));
  if (!el) return false;
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(el, { offset: -72, force: true, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
  history.replaceState(null, "", hash.startsWith("/") ? hash : `/${hash}`);
  return true;
}
