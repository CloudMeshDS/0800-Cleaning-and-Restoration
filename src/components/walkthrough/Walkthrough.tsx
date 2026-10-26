"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { gsap, useGSAP, MQ, ScrollTrigger } from "@/lib/gsap";
import { SCRUB } from "../stories/StoryScene";
import { SERVICES } from "@/data/services";
import { FINALE, TASKS } from "./timeline";
import type { Walkthrough as Engine } from "./engine";

/**
 * Home-page journey through a real-time 3D home, driven by scroll: from the
 * street, through the gate and front door, then room by room as each job is
 * done in front of you. The 3D engine (three.js) loads only as the visitor
 * nears the section, so it never slows the first paint.
 */

type Beat = { at: number; eyebrow: string; title: string; body: string; href?: string; check?: string; done?: number };

const lead = 0.025;
const BEATS: Beat[] = [
  { at: 0, eyebrow: "The 0800 home tour", title: "Welcome home.", body: "Scroll to walk through the gate and watch each room cared for." },
  { at: TASKS.floor[0] - lead, eyebrow: "01 · Home Refresh", title: "Floors that glow again.", body: "Muddy footprints and grit lifted with professional microfibre.", href: "/services/home-refresh", check: "Home Refresh", done: TASKS.floor[1] },
  { at: TASKS.tiles[0] - lead, eyebrow: "02 · Tile & Grout Revive", title: "Grout, back to bright.", body: "Grease and grime scrubbed from tiles and porous grout lines.", href: "/services/tile-grout-revive", check: "Tile & Grout Revive", done: TASKS.tiles[1] },
  { at: TASKS.curtains[0] - lead, eyebrow: "03 · Curtain Care & Rehang", title: "Curtains, fresh again.", body: "Dust and marks lifted with methods matched to the fabric.", href: "/services/curtain-care", check: "Curtain Care", done: TASKS.curtains[1] },
  { at: TASKS.carpet[0] - lead, eyebrow: "04 · Carpet Deep Refresh", title: "Carpet, deep down clean.", body: "Deep vacuuming, then hot-water extraction for stains and traffic lanes.", href: "/services/carpet-deep-refresh", check: "Carpet Deep Refresh", done: TASKS.carpet[1] },
  { at: TASKS.sofa[0] - lead, eyebrow: "05 · Sofa & Upholstery Refresh", title: "Sofas, refreshed.", body: "Fabric-safe extraction for cushions, seats and backs.", href: "/services/sofa-upholstery-refresh", check: "Sofa & Upholstery", done: TASKS.sofa[1] },
  { at: TASKS.glass[0] - lead, eyebrow: "06 · Glass & Window Care", title: "Let the light in.", body: "Streak-free glass, squeegeed top to bottom.", href: "/services/glass-care", check: "Glass & Window Care", done: TASKS.glass[1] },
  { at: FINALE, eyebrow: "Every room, cared for", title: "Clean spaces. Extraordinary living.", body: "Pick one service or the whole home – we'll put together a clear, indicative quote." },
];
const CHECKS = BEATS.filter((b) => b.check);

/** Scroll distance for the whole journey, in viewport heights. */
const LENGTH = { desktop: 22, mobile: 16 };

export function Walkthrough() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const stage = root.current!.querySelector<HTMLElement>("[data-stage]")!;
      const q = (s: string) => gsap.utils.toArray<HTMLElement>(s, stage);
      const mm = gsap.matchMedia();
      let engine: Engine | null = null;
      let progress = 0;
      let alive = true;

      // Load the 3D engine as the visitor approaches (or once the page is idle).
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        io.disconnect();
        import("./engine")
          .then(({ createWalkthrough }) => {
            if (!alive) return;
            try {
              const pct = stage.querySelector<HTMLElement>("[data-load-pct]");
              const bar = stage.querySelector<HTMLElement>("[data-load-bar]");
              stage.dataset.ready = "loading";
              engine = createWalkthrough(canvasRef.current!, {
                onProgress: (p) => {
                  if (pct) pct.textContent = `${Math.round(p * 100)}%`;
                  if (bar) bar.style.transform = `scaleX(${p})`;
                },
                onReady: () => alive && (stage.dataset.ready = "true"),
              });
              engine.setProgress(progress);
              if (process.env.NODE_ENV !== "production") (window as unknown as { __walk?: Engine }).__walk = engine;
            } catch {
              stage.dataset.ready = "fallback";
            }
          })
          .catch(() => (stage.dataset.ready = "fallback"));
      };
      const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && start(), { rootMargin: "120% 0px" });
      io.observe(root.current!);
      // Or start as soon as the page has finished loading, so the tour is usually ready before it's reached.
      let idle = 0;
      const onLoad = () => (idle = window.setTimeout(start, 200));
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
      const onResize = () => engine?.resize();
      window.addEventListener("resize", onResize);

      const build = (scrolling: boolean, mobile: boolean) => {
        const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
        const play = { t: 0 };
        tl.to(play, {
          t: 1,
          duration: 1,
          onUpdate: () => {
            progress = play.t;
            engine?.setProgress(progress);
          },
        }, 0);
        const caps = q("[data-caption]");
        BEATS.forEach((b, i) => {
          if (i > 0) tl.to(caps[i - 1], { autoAlpha: 0, y: -14, duration: 0.008, ease: "sine.in" }, b.at);
          tl.fromTo(caps[i], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.012, ease: "sine.out" }, b.at + 0.006);
        });
        CHECKS.forEach((b, i) => {
          tl.fromTo(q("[data-tick]")[i], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.008, ease: "back.out(2)" }, b.done!);
          tl.to(q("[data-check-label]")[i], { opacity: 1, duration: 0.008 }, b.done!);
          tl.fromTo(q("[data-tick-m]")[i], { scale: 0 }, { scale: 1, duration: 0.008, ease: "back.out(2)" }, b.done!);
        });
        tl.fromTo(q("[data-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

        if (scrolling) {
          ScrollTrigger.create({
            animation: tl,
            trigger: root.current,
            start: "top top",
            end: `+=${(mobile ? LENGTH.mobile : LENGTH.desktop) * 100}%`,
            pin: stage,
            scrub: SCRUB,
            anticipatePin: 1,
          });
        } else {
          tl.progress(1);
          progress = 1;
          engine?.setProgress(1);
        }
      };

      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile, reduced: MQ.reduced }, (c) => {
        const { desktop, mobile } = c.conditions as Record<string, boolean>;
        build(desktop || mobile, !!mobile);
      });

      return () => {
        alive = false;
        io.disconnect();
        window.clearTimeout(idle);
        window.removeEventListener("load", onLoad);
        window.removeEventListener("resize", onResize);
        engine?.dispose();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="home-tour" aria-labelledby="tour-title" className="relative bg-charcoal">
      <div data-stage className="group relative h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#9cbbd6,#efe3d2)]">
        {/* Loader: shown until the 3D home and its textures are ready */}
        <div
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-[linear-gradient(180deg,#1f3b33,#16302a)] transition-opacity duration-700 group-data-[ready=fallback]:opacity-0 group-data-[ready=true]:opacity-0"
          aria-hidden
        >
          <div className="flex flex-col items-center text-ivory">
            <span className="relative grid size-20 place-items-center">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-ivory/15 border-t-brass [animation-duration:1.1s]" />
              <span className="font-serif text-xl">0800</span>
            </span>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.3em] text-ivory/90">Loading services</p>
            <div className="mt-4 h-[3px] w-56 overflow-hidden rounded-full bg-ivory/15">
              <div data-load-bar className="h-full origin-left bg-brass transition-transform duration-300" style={{ transform: "scaleX(0)" }} />
            </div>
            <p data-load-pct className="mt-2 text-xs tabular-nums text-ivory/50" />
          </div>
        </div>
        <p role="status" className="sr-only group-data-[ready=true]:hidden">
          Loading services
        </p>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-700 group-data-[ready=true]:opacity-100"
          aria-label="A 3D walk through a home: through the gate and front door, then each room cleaned in turn"
          role="img"
        />

        {/* Legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/40 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/45 via-black/10 to-transparent md:h-[38%]" aria-hidden />

        {/* Progress + compact checklist */}
        <div className="container-x pointer-events-none absolute inset-x-0 top-24 md:top-28">
          <h2 id="tour-title" className="eyebrow !text-white/90">
            The 0800 home tour
          </h2>
          <div className="mt-3 h-[3px] w-40 overflow-hidden rounded-full bg-white/25 md:w-56">
            <div data-progress className="h-full origin-left bg-white" />
          </div>
          <div className="mt-3 flex items-center gap-1.5 lg:hidden" aria-hidden>
            {CHECKS.map((b) => (
              <span key={b.check} className="relative grid size-3.5 place-items-center rounded-full border border-white/60">
                <span data-tick-m className="size-2 scale-0 rounded-full bg-white" />
              </span>
            ))}
          </div>
        </div>

        {/* Captions */}
        <div className="container-x absolute inset-x-0 bottom-20 md:bottom-12">
          <div className="relative min-h-[150px] max-w-md" aria-live="polite">
            {BEATS.map((c, i) => (
              <div key={c.title} data-caption className="absolute inset-x-0 bottom-0 rounded-[22px] bg-ivory/95 p-5 shadow-(--shadow-lux) sm:p-6 md:p-7" style={i ? { opacity: 0, visibility: "hidden" } : undefined}>
                <p className="eyebrow">{c.eyebrow}</p>
                <p className="display mt-2 text-[1.5rem] text-forest sm:text-[1.9rem] md:text-[2.2rem]">{c.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/70 sm:text-[0.95rem]">{c.body}</p>
                {c.href && (
                  <Link href={c.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
                    Explore this service <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                )}
                {i === BEATS.length - 1 && (
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link href="/quote" className="btn-primary !py-3">
                      Get a Free Quote <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    <Link href="/services" className="btn-ghost !py-3">
                      All services
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist (desktop) */}
        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-[24px] bg-ivory/95 p-6 shadow-(--shadow-lux) md:right-10 lg:block">
          <p className="eyebrow">Today&apos;s visit</p>
          <ul className="mt-4 space-y-2.5">
            {CHECKS.map((b) => (
              <li key={b.check}>
                <Link href={b.href!} className="flex items-center gap-3 text-sm text-forest">
                  <span className="relative grid size-5 place-items-center rounded-full border border-forest/25">
                    <span data-tick className="absolute inset-0 grid place-items-center rounded-full bg-forest text-ivory opacity-0">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </span>
                  <span data-check-label className="opacity-50">
                    {b.check}
                  </span>
                </Link>
              </li>
            ))}
            {SERVICES.length > CHECKS.length && <li className="pt-1 text-xs text-charcoal/50">+ {SERVICES.length - CHECKS.length} more services</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
