"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, MQ, ScrollTrigger } from "@/lib/gsap";
import { Curtain } from "../scene/Curtain";
import { WindowFrame, WindowView } from "../scene/WindowView";
import { noise } from "@/lib/textures";
import { pos, wipe, Wipe } from "../stories/motion";
import { SCRUB } from "../stories/StoryScene";

const HUE = "#d8c9ae";

const STEPS = ["Before", "Detach", "Clean", "Rehang", "After"] as const;

/* ────────────────────────────── Room ────────────────────────────── */

function Room({ variant = "live", id }: { variant?: "live" | "before" | "after"; id: string }) {
  const after = variant === "after";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e7e0d2]">
      <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_30%,#f3efe6_0%,#e6dfd0_55%,#d6cdbb_100%)]" />
      {/* Window */}
      <div className="absolute inset-x-[16%] top-[16%] bottom-[27%] md:inset-x-[29%]">
        <div className="absolute inset-0 overflow-hidden">
          <WindowView id={id} className="size-full" />
        </div>
        <WindowFrame panes={2} />
      </div>
      {/* Floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[23%]"
        style={{
          backgroundColor: "#cbb597",
          backgroundImage:
            "linear-gradient(180deg, rgb(0 0 0 / 0.14), transparent 30%), repeating-linear-gradient(90deg, rgb(80 55 30 / 0.12) 0 1px, transparent 1px 90px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-[23%] h-[8px] bg-[#f3efe7] shadow-[0_2px_4px_rgb(0_0_0/0.08)]" />

      {/* Rail */}
      <div className="absolute inset-x-[5%] top-[11%] h-[7px] rounded-full bg-gradient-to-b from-[#a39b8b] to-[#6d675c] shadow-[0_3px_6px_rgb(0_0_0/0.2)] md:inset-x-[19%]">
        <span className="absolute -left-2 -top-[3px] size-[13px] rounded-full bg-[#6d675c]" />
        <span className="absolute -right-2 -top-[3px] size-[13px] rounded-full bg-[#6d675c]" />
      </div>
      {/* Hook glint where hooks seat on the rail */}
      <div data-glint className="absolute inset-x-[5%] top-[11%] h-[7px] rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.9),transparent)] opacity-0 md:inset-x-[19%]" />

      {/* Curtains */}
      <div data-curtain-wrap="left" className="absolute left-[5%] top-[calc(11%+5px)] bottom-[22%] w-[19%] origin-top md:left-[19%] md:w-[12.5%]">
        <Curtain side="left" pleats={7} hue={HUE} hooks dust={!after} />
      </div>
      <div data-curtain-wrap="right" className="absolute right-[5%] top-[calc(11%+5px)] bottom-[22%] w-[19%] origin-top md:right-[19%] md:w-[12.5%]">
        <Curtain side="right" pleats={7} hue={HUE} hooks dust={!after} />
      </div>

      {/* Lighting: dull cast before, sunlight after */}
      <div data-dull className="pointer-events-none absolute inset-0 bg-[#3e392f]/22 will-change-[opacity]" style={{ opacity: after ? 0 : 1 }} />
      <div
        data-sunlight
        className="pointer-events-none absolute inset-0 will-change-[opacity]"
        style={{
          opacity: after ? 1 : 0,
          background:
            "radial-gradient(60% 55% at 50% 38%, rgb(255 248 228 / 0.42), transparent 70%), linear-gradient(115deg, transparent 40%, rgb(255 246 220 / 0.22) 55%, transparent 70%)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────── Fabric close-up ─────────────────────────── */

function FabricCloseUp() {
  const weave = `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.10) 0 2px, transparent 2px 5px), repeating-linear-gradient(0deg, rgb(0 0 0 / 0.07) 0 2px, transparent 2px 5px)`;
  const folds = `repeating-linear-gradient(90deg, rgb(0 0 0 / 0.20) 0px, rgb(255 255 255 / 0.20) 90px, rgb(255 255 255 / 0.28) 120px, rgb(0 0 0 / 0.20) 220px)`;
  return (
    <div data-closeup className="absolute inset-0 overflow-hidden opacity-0" aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: "#e3d6bf", backgroundImage: `${weave}, ${folds}` }} />
      {/* Soiled layer – clipped away as treatment passes */}
      <Wipe name="soil">
        <div
          className="absolute inset-0"
          style={{
          backgroundColor: "#b5a78e",
          backgroundImage: `${noise({ freq: 0.04, octaves: 3, alpha: 0.45, rgb: "80 65 40", size: 400 })}, ${noise({ freq: 0.9, octaves: 2, alpha: 0.35, rgb: "60 50 35", seed: 7 })}, ${weave}, ${folds}`,
          backgroundSize: "400px 400px, 220px 220px, auto, auto",
          }}
        />
      </Wipe>
      {/* Treatment head: a soft band of vapour and light */}
      <div data-head className="absolute inset-y-0 left-0 w-[14%] will-change-transform">
        <div className="absolute inset-y-0 left-[calc(50%-1.5px)] w-[3px] bg-white/80 shadow-[0_0_30px_10px_rgb(255_255_255/0.55)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.35),transparent)] blur-md" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_50%,transparent_40%,rgb(0_0_0/0.28)_100%)]" />

      {/* Method notes */}
      <ul className="absolute bottom-[12%] right-[5%] hidden max-w-xs space-y-2 md:block">
        {["Fabric & care label assessed", "Method matched: dry, wet or low-moisture", "Lining and colour-fastness checked"].map((t) => (
          <li data-chip key={t} className="rounded-full bg-white/95 px-4 py-2 text-[0.8rem] font-medium text-forest opacity-0 shadow-sm">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── Section ───────────────────────────── */

const CAPTIONS = [
  { title: "Everyday life leaves its mark.", body: "Dust, cooking residue and condensation settle into fabric slowly – until the room feels flatter than it should." },
  { title: "Taken down, hook by hook.", body: "We release each hook carefully and fold the fabric to protect its shape." },
  { title: "Cleaned with the method it needs.", body: "Not every curtain can be washed. We assess fabric, lining and care label, then choose a dry, wet or low-moisture method to suit." },
  { title: "Rehung, pleat by pleat.", body: "Hooks seated back on the rail, folds dressed so the fabric falls the way it was made to." },
  { title: "Fresh fabric. Beautifully finished.", body: "A brighter, fresher room – without replacing a thing." },
];

export function CurtainSequence({ ctaHref = "/services/curtain-care", ctaLabel = "Explore Curtain Care" }: { ctaHref?: string; ctaLabel?: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      ScrollTrigger.config({ ignoreMobileResize: true });

      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean };
        const stage = root.current!.querySelector<HTMLElement>("[data-stage]")!;
        const q = gsap.utils.selector(stage);
        const captions = q("[data-caption]");
        const pleatsL = q("[data-curtain-wrap='left'] [data-pleat]");
        const pleatsR = q("[data-curtain-wrap='right'] [data-pleat]").reverse(); // inner edge first
        const pleats = [...pleatsL, ...pleatsR];
        const hooks = q("[data-hook]");
        const wraps = q("[data-curtain-wrap]");



        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: desktop ? "+=420%" : "+=260%",
            pin: stage,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const caption = (from: number, to: number, at: number) => {
          tl.to(captions[from], { autoAlpha: 0, y: -20, duration: 0.3 }, at);
          tl.fromTo(captions[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35 }, at + 0.15);
        };

        // Progress rail spans the whole sequence.
        tl.fromTo(q("[data-progress]"), { scaleY: 0 }, { scaleY: 1, duration: 10 }, 0);
        q("[data-step]").forEach((el, i) => tl.to(el, { color: "#173D35", opacity: 1, duration: 0.2 }, i * 2.1));

        // SCENE 1 – before: a faint breath of movement while the viewer reads.
        tl.to(pleats, { skewX: 1.2, duration: 0.9, stagger: 0.02, ease: "sine.inOut" }, 0);

        // SCENE 2 – detach: hooks lift off, fabric sags, then gathers and lowers away.
        caption(0, 1, 1.0);
        tl.to(hooks, { y: -10, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power1.in" }, 1.1);
        tl.to(pleats, { y: 18, skewX: -2, rotate: (i) => (i % 2 ? 0.35 : -0.35), scaleX: 1.04, duration: 0.6, stagger: 0.04 }, 1.2);
        tl.to(q("[data-curtain-wrap='left']"), { xPercent: 70, scaleX: 0.55, duration: 0.8, ease: "power2.inOut" }, 1.9);
        tl.to(q("[data-curtain-wrap='right']"), { xPercent: -70, scaleX: 0.55, duration: 0.8, ease: "power2.inOut" }, 1.9);
        tl.to(wraps, { yPercent: 105, scaleY: 0.35, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 2.6);

        // SCENE 3 – cleaning close-up.
        caption(1, 2, 3.2);
        tl.to(q("[data-room-layer]"), { scale: 1.35, autoAlpha: 0, duration: 0.6, ease: "power2.in" }, 3.2);
        tl.fromTo(q("[data-closeup]"), { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 3.5);
        tl.fromTo(q("[data-chip]"), { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.25 }, 3.9);
        const [head] = q("[data-head]");
        gsap.set(head, { xPercent: -50 });
        tl.fromTo(head, { x: pos(head, "x", 0) }, { x: pos(head, "x", 1), duration: 1.9, ease: "power1.inOut" }, 4.0);
        wipe(tl, q("[data-wipe='soil']")[0], 4.0, 1.9, "power1.inOut");

        // SCENE 4 – reinstallation: room returns clean-but-empty, curtains rise to the rail.
        caption(2, 3, 6.0);
        tl.to(q("[data-closeup]"), { autoAlpha: 0, scale: 0.94, duration: 0.5, ease: "power2.in" }, 6.0);
        tl.to(q("[data-room-layer]"), { scale: 1, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 6.2);
        tl.set(q("[data-dust]"), { autoAlpha: 0 }, 6.2);
        tl.to(wraps, { yPercent: 0, scaleY: 1, autoAlpha: 1, duration: 0.7, ease: "power2.out" }, 6.5);
        tl.to(q("[data-curtain-wrap]"), { xPercent: 0, scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 7.0);
        tl.to(hooks, { y: 0, opacity: 1, duration: 0.35, stagger: 0.03, ease: "back.out(2)" }, 7.3);
        tl.fromTo(q("[data-glint]"), { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.25 }, 7.7);
        tl.to(q("[data-glint]"), { opacity: 0, duration: 0.25 }, 7.95);
        // Fabric settles: overshoot slightly, then hang true.
        tl.to(pleats, { y: 0, rotate: 0, scaleX: 1, skewX: 1.5, duration: 0.35, stagger: 0.02, ease: "sine.out" }, 7.5);
        tl.to(pleats, { skewX: 0, duration: 0.4, stagger: 0.02, ease: "sine.inOut" }, 7.9);

        // SCENE 5 – after: light floods in.
        caption(3, 4, 8.4);
        tl.to(q("[data-dull]"), { opacity: 0, duration: 0.8 }, 8.3);
        tl.to(q("[data-sunlight]"), { opacity: 1, duration: 0.9 }, 8.4);
        tl.fromTo(q("[data-final-cta]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 8.8);
        tl.to({}, { duration: 0.6 }); // brief hold before the pin releases
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="curtains" aria-labelledby="curtains-title" className="relative bg-forest-deep">
      {/* ── Animated version (motion allowed) ── */}
      <div data-stage className="relative h-[100svh] overflow-hidden motion-reduce:hidden">
        <div data-room-layer className="absolute inset-0 origin-[50%_45%]">
          <Room id="cs-live" />
        </div>
        <FabricCloseUp />

        {/* Top scrim + headline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-forest-deep/75 via-forest-deep/30 to-transparent" />
        <div className="container-x pointer-events-none absolute inset-x-0 top-24 md:top-28">
          <p className="eyebrow !text-ivory/75">Signature service · Curtain care</p>
          <h2 id="curtains-title" className="display mt-3 text-[clamp(2.2rem,4.6vw,4.2rem)] text-ivory drop-shadow-[0_2px_20px_rgb(0_0_0/0.25)]">
            From Worn to Wonderful.
          </h2>
          <p className="mt-3 max-w-md text-ivory/85">Careful cleaning. Beautiful results. A fresh new feel for your space.</p>
        </div>

        {/* Captions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-forest-deep/80 to-transparent" />
        <div className="container-x absolute inset-x-0 bottom-24 md:bottom-14">
          <div className="relative min-h-[150px] max-w-lg" aria-live="polite">
            {CAPTIONS.map((c, i) => (
              <div key={c.title} data-caption className="absolute inset-x-0 bottom-0 text-ivory" style={i ? { opacity: 0, visibility: "hidden" } : undefined}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-sage">0{i + 1} — {STEPS[i]}</p>
                <p className="mt-2 font-serif text-2xl md:text-3xl">{c.title}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ivory/75">{c.body}</p>
                {i === 4 && (
                  <Link data-final-cta href={ctaHref} className="btn-light mt-5 !py-3">
                    {ctaLabel} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress rail */}
        <ol className="absolute right-5 top-1/2 hidden -translate-y-1/2 md:right-10 md:block" aria-hidden>
          <span className="absolute left-[3px] top-1 bottom-1 w-px bg-ivory/20" />
          <span data-progress className="absolute left-[3px] top-1 bottom-1 w-px origin-top bg-ivory" />
          {STEPS.map((s) => (
            <li key={s} data-step className="relative flex items-center gap-3 py-3 pl-5 text-xs font-semibold uppercase tracking-[0.2em] text-ivory opacity-40">
              <span className="absolute left-0 size-[7px] rounded-full bg-current" />
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Reduced-motion version: static before / after ── */}
      <div className="hidden bg-ivory py-24 motion-reduce:block">
        <div className="container-x">
          <p className="eyebrow">Signature service · Curtain care</p>
          <h2 className="display mt-3 text-5xl text-forest">From Worn to Wonderful.</h2>
          <p className="mt-3 max-w-md text-charcoal/75">Careful cleaning. Beautiful results. A fresh new feel for your space.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {(["before", "after"] as const).map((v) => (
              <figure key={v}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Room id={`cs-${v}`} variant={v} />
                </div>
                <figcaption className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-forest/70">
                  {v === "before" ? "Before – everyday life leaves its mark" : "After – fresh fabric, beautifully finished"}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-charcoal/70">{CAPTIONS[2].body}</p>
          <Link href={ctaHref} className="btn-primary mt-8">
            {ctaLabel} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
