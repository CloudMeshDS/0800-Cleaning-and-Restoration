"use client";

/**
 * A real photograph with a "before" version layered on top.
 *
 * The before layer is the same photo, dulled with CSS filters and overlaid with
 * a grime texture tuned to the surface (algae on cladding, haze on glass, dust
 * on fabric, scuffs on timber…). It sits in a <Wipe>, so a timeline can clean
 * it away with transforms only, while a soft sheen of light rides the edge.
 */

import type { CSSProperties } from "react";
import { noise } from "@/lib/textures";
import { photoSrcSet, photoUrl, type Photo } from "@/data/photos";
import { gsap } from "@/lib/gsap";
import { pos, Wipe, wipe } from "../stories/motion";

export type Grime = "algae" | "haze" | "dust" | "scuff" | "grease" | "grout" | "faded";

const FILTER: Record<Grime, string> = {
  algae: "saturate(0.55) brightness(0.8) contrast(0.92) sepia(0.2) hue-rotate(-8deg)",
  haze: "saturate(0.6) brightness(0.9) contrast(0.78) blur(1.2px)",
  dust: "saturate(0.55) brightness(0.84) contrast(0.9) sepia(0.28)",
  scuff: "saturate(0.35) brightness(0.86) contrast(0.85) sepia(0.15)",
  grease: "saturate(0.6) brightness(0.86) contrast(0.88) sepia(0.32)",
  grout: "saturate(0.5) brightness(0.8) contrast(0.95) sepia(0.25)",
  faded: "grayscale(0.85) sepia(0.45) brightness(1.08) contrast(0.85)",
};

const OVERLAY: Record<Grime, CSSProperties> = {
  algae: {
    backgroundColor: "rgb(54 70 38 / 0.32)",
    backgroundImage: `linear-gradient(180deg, rgb(40 55 28 / 0.35), transparent 35%, transparent 60%, rgb(45 52 30 / 0.5)), ${noise({ freq: 0.012, octaves: 4, alpha: 0.55, rgb: "45 60 30", size: 700, seed: 71 })}, ${noise({ freq: 0.9, alpha: 0.3, rgb: "40 45 30", seed: 72 })}`,
    backgroundSize: "100% 100%, 700px 700px, 220px 220px",
  },
  haze: {
    backgroundColor: "rgb(236 233 224 / 0.38)",
    backgroundImage: `${noise({ freq: 0.02, octaves: 3, alpha: 0.45, rgb: "255 255 255", size: 500, seed: 73 })}, ${noise({ freq: 0.6, alpha: 0.35, rgb: "255 255 255", seed: 74 })}`,
    backgroundSize: "500px 500px, 220px 220px",
  },
  dust: {
    backgroundColor: "rgb(112 94 66 / 0.26)",
    backgroundImage: `${noise({ freq: 0.015, octaves: 4, alpha: 0.5, rgb: "95 78 52", size: 600, seed: 75 })}, ${noise({ freq: 1.1, alpha: 0.32, rgb: "80 66 45", seed: 76 })}`,
    backgroundSize: "600px 600px, 220px 220px",
  },
  scuff: {
    backgroundColor: "rgb(140 134 124 / 0.3)",
    backgroundImage: `repeating-linear-gradient(115deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 41px), repeating-linear-gradient(62deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 57px), ${noise({ freq: 0.02, octaves: 3, alpha: 0.4, rgb: "90 85 75", size: 600, seed: 77 })}`,
    backgroundSize: "auto, auto, 600px 600px",
  },
  grease: {
    backgroundColor: "rgb(168 138 80 / 0.2)",
    backgroundImage: `${noise({ freq: 0.025, octaves: 3, alpha: 0.45, rgb: "140 110 60", size: 500, seed: 78 })}, ${noise({ freq: 0.9, alpha: 0.35, rgb: "110 85 45", seed: 79 })}`,
    backgroundSize: "500px 500px, 220px 220px",
  },
  grout: {
    backgroundColor: "rgb(86 74 56 / 0.28)",
    backgroundImage: `${noise({ freq: 0.018, octaves: 4, alpha: 0.55, rgb: "70 58 40", size: 600, seed: 80 })}, ${noise({ freq: 1, alpha: 0.35, rgb: "60 50 35", seed: 81 })}`,
    backgroundSize: "600px 600px, 220px 220px",
  },
  faded: {
    backgroundColor: "rgb(226 214 190 / 0.18)",
    backgroundImage: `${noise({ freq: 0.012, octaves: 3, alpha: 0.3, rgb: "150 130 100", size: 700, seed: 82 })}`,
    backgroundSize: "700px 700px",
  },
};

export function PhotoImg({ photo, priority = false, className = "", style }: { photo: Photo; priority?: boolean; className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- CDN images with a responsive srcset
    <img
      src={photoUrl(photo.id, 1920)}
      srcSet={photoSrcSet(photo.id)}
      sizes="100vw"
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={`absolute inset-0 size-full select-none object-cover ${className}`}
      style={{ objectPosition: photo.position ?? "50% 50%", ...style }}
    />
  );
}

/**
 * Clean photo + wipe-able "before" layer + sheen. Animate with `wipe(tl, [data-wipe=name])`
 * and move `[data-sheen=name]` across with the same easing.
 */
export function DirtyPhoto({
  photo,
  grime,
  name,
  axis = "x",
  dir = 1,
  priority = false,
}: {
  photo: Photo;
  grime: Grime;
  name: string;
  axis?: "x" | "y";
  dir?: 1 | -1;
  priority?: boolean;
}) {
  return (
    <>
      <PhotoImg photo={photo} priority={priority} />
      <Wipe name={name} axis={axis} dir={dir}>
        <PhotoImg photo={photo} priority={priority} style={{ filter: FILTER[grime] }} className="scale-[1.01]" />
        <div className="absolute inset-0" style={OVERLAY[grime]} />
      </Wipe>
      {/* Sheen riding the cleaning edge */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          data-sheen={name}
          className={`absolute opacity-0 will-change-transform ${axis === "x" ? "inset-y-0 left-0 w-[16vw] min-w-28" : "inset-x-0 top-0 h-[16vh] min-h-24"}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${axis === "x" ? "90deg" : "180deg"}, transparent, rgb(255 255 255 / 0.22) 45%, rgb(255 255 255 / 0.32) 50%, rgb(255 255 255 / 0.22) 55%, transparent)`,
            }}
          />
          <div
            className={`absolute bg-white/80 shadow-[0_0_24px_6px_rgb(255_255_255/0.45)] ${axis === "x" ? "inset-y-0 left-[calc(50%-1px)] w-[2px]" : "inset-x-0 top-[calc(50%-1px)] h-[2px]"}`}
          />
        </div>
      </div>
    </>
  );
}

/**
 * One cleaning pass: wipe the before layer away while the sheen travels along
 * the same edge with the same easing. Returns the time the pass ends.
 */
export function cleanPass(tl: gsap.core.Timeline, scope: Element, name: string, at: number, duration: number, ease = "power1.inOut") {
  const outer = scope.querySelector<HTMLElement>(`[data-wipe="${name}"]`)!;
  const sheen = scope.querySelector<HTMLElement>(`[data-sheen="${name}"]`)!;
  const axis = outer.dataset.axis === "y" ? "y" : "x";
  const dir = Number(outer.dataset.dir);
  const [from, to] = dir === 1 ? [0, 1] : [1, 0];
  gsap.set(sheen, axis === "x" ? { xPercent: -50 } : { yPercent: -50 });
  wipe(tl, outer, at, duration, ease);
  tl.fromTo(sheen, { [axis]: pos(sheen, axis, from) }, { [axis]: pos(sheen, axis, to), duration, ease }, at);
  tl.fromTo(sheen, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "sine.out" }, at);
  tl.to(sheen, { opacity: 0, duration: 0.2, ease: "sine.in" }, at + duration - 0.2);
  return at + duration;
}
