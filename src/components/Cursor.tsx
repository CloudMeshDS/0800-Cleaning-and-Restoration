"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * A fine brass ring that trails the pointer and opens up over links and
 * buttons. Desktop mice only; the native cursor stays visible so nothing
 * about usability changes. Transform-only, so it never triggers layout.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el || !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });
    const x = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.4 });
        shown = true;
      }
      x(e.clientX);
      y(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const hit = (e.target as Element).closest("a, button, label, [role='tab']");
      gsap.to(el, { scale: hit ? 1.9 : 1, backgroundColor: hit ? "rgba(176,141,87,0.12)" : "rgba(176,141,87,0)", duration: 0.45, ease: "power3.out" });
    };
    const leave = () => {
      gsap.to(el, { opacity: 0, duration: 0.3 });
      shown = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[90] hidden size-8 rounded-full border border-brass/70 will-change-transform [@media(pointer:fine)]:block" />;
}
