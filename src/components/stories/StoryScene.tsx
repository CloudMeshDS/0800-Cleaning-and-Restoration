"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { gsap, useGSAP, MQ } from "@/lib/gsap";

export type Q = (selector: string) => HTMLElement[];
export type Build = (q: Q, tl: gsap.core.Timeline) => void;

/**
 * Seconds the animation takes to catch up with the scroll position. Combined
 * with Lenis inertial scrolling this gives a continuous, eased glide.
 */
export const SCRUB = 1.2;

/**
 * Wire a scrubbed timeline to a tall section. Motion users get the timeline
 * tied to scroll; reduced-motion users get the finished state immediately.
 * `after` lets callers add extra tweens (e.g. step highlights) to the end.
 */
export function useStoryTimeline(root: RefObject<HTMLElement | null>, build: Build, after?: (q: Q, tl: gsap.core.Timeline) => void) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(root) as Q;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: SCRUB, invalidateOnRefresh: true },
        });
        build(q, tl);
        after?.(q, tl);
        gsap.from(q("[data-copy] > *"), {
          y: 30,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      });
      mm.add(MQ.reduced, () => {
        const tl = gsap.timeline({ paused: true });
        build(q, tl);
        after?.(q, tl);
        tl.progress(1);
      });
    },
    { scope: root },
  );
}

/**
 * Compact scroll scene for service detail pages: the visual plus a numbered
 * list of steps that light up as the animation reaches each one.
 */
export function MotionShowcase({ title, steps, visual, build }: { title: string; steps: string[]; visual: ReactNode; build: Build }) {
  const root = useRef<HTMLElement>(null);
  useStoryTimeline(root, build, (q, tl) => {
    const d = Math.max(tl.duration(), 1);
    const items = q("[data-step]");
    tl.fromTo(q("[data-progress]"), { scaleY: 0 }, { scaleY: 1, duration: d, ease: "none" }, 0);
    items.forEach((el, i) => {
      tl.fromTo(el, { opacity: 0.35 }, { opacity: 1, duration: 0.2, ease: "sine.out" }, (d * i) / items.length);
    });
    // Phones: one step at a time, swapping as the animation reaches it.
    const lines = q("[data-step-m]");
    lines.forEach((el, i) => {
      const at = (d * i) / lines.length;
      if (i) tl.fromTo(el, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "sine.out" }, at);
      if (i < lines.length - 1) tl.to(el, { autoAlpha: 0, y: -10, duration: 0.2, ease: "sine.in" }, (d * (i + 1)) / lines.length - 0.1);
    });
  });

  return (
    <section ref={root} aria-labelledby="motion-title" className="relative h-[200vh] bg-ivory motion-reduce:h-auto md:h-[230vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:py-20">
        <div className="container-x grid items-center gap-8 pt-[72px] md:grid-cols-[4fr_7fr] md:gap-14 md:pt-0">
          <div data-copy>
            <p className="eyebrow">See it in motion</p>
            <h2 id="motion-title" className="display mt-4 text-[clamp(2rem,3.8vw,3.4rem)] text-forest">
              {title}
            </h2>
            <div className="relative mt-4 h-12 sm:hidden" aria-hidden>
              {steps.map((s, i) => (
                <p key={s} data-step-m className="absolute inset-x-0 top-0 flex items-baseline gap-2 text-[0.95rem] text-charcoal" style={i ? { opacity: 0, visibility: "hidden" } : undefined}>
                  <span className="num shrink-0 text-sm">
                    0{i + 1}/0{steps.length}
                  </span>
                  {s}
                </p>
              ))}
            </div>
            <ol className="relative mt-7 hidden pl-6 sm:block">
              <span className="absolute bottom-1 left-[3px] top-1 w-px bg-forest/15" aria-hidden />
              <span data-progress className="absolute bottom-1 left-[3px] top-1 w-px origin-top bg-forest will-change-transform" aria-hidden />
              {steps.map((s, i) => (
                <li key={s} data-step className="relative py-2.5 text-[0.95rem] text-charcoal will-change-[opacity]">
                  <span className="absolute -left-6 top-[1.05rem] size-[7px] rounded-full bg-forest" aria-hidden />
                  <span className="mr-2 font-serif text-forest/50">0{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="relative h-[52svh] overflow-hidden rounded-[28px] shadow-(--shadow-soft) md:h-[70vh]">{visual}</div>
        </div>
      </div>
    </section>
  );
}
