"use client";

/**
 * Visuals + scroll timelines for every cinematic service story.
 *
 * Everything is CSS/SVG (no downloads). All motion is transform/opacity only:
 * tools move with x/y transforms and dirt is removed with counter-translating
 * <Wipe> layers, so the compositor does the work and scrubbing stays smooth.
 * Each tool travels the same path, with the same easing, as the layer it
 * removes – the cleaning reads as cause and effect.
 */

import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { noise } from "@/lib/textures";
import { WindowFrame, WindowView } from "../scene/WindowView";
import type { Build } from "./StoryScene";
import { counter, EASE, moveTo, place, pos, Wipe, wipe } from "./motion";

/* ═══════════════════════════════ shared ═══════════════════════════════ */

function Label({ children, className = "", tone = "dark" }: { children: ReactNode; className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={`absolute z-10 rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-wide ${
        tone === "light" ? "bg-black/35 text-white" : "bg-white/80 text-forest"
      } ${className}`}
    >
      {children}
    </span>
  );
}

const vignette = "absolute inset-0 pointer-events-none bg-[radial-gradient(90%_80%_at_50%_45%,transparent_35%,rgb(0_0_0/0.5)_100%)]";

/** Three horizontal lanes, cleaned in a serpentine: → ← → */
export const LANES: { region: [number, number, number, number]; dir: 1 | -1; y: number }[] = [
  { region: [0, 0, 100, 33.34], dir: 1, y: 1 / 6 },
  { region: [33.33, 0, 100, 33.34], dir: -1, y: 0.5 },
  { region: [66.66, 0, 100, 33.34], dir: 1, y: 5 / 6 },
];

/** Drive a tool through the three lanes while wiping each one. Returns end time. */
export function serpentine(tl: gsap.core.Timeline, tool: HTMLElement, lanes: HTMLElement[], start: number, laneDur = 1, turn = 0.25) {
  tl.fromTo(tool, { x: pos(tool, "x", 0), y: pos(tool, "y", LANES[0].y) }, { x: pos(tool, "x", 1), duration: laneDur, ease: EASE }, start);
  wipe(tl, lanes[0], start, laneDur);
  let t = start + laneDur;
  for (let i = 1; i < 3; i++) {
    moveTo(tl, tool, { y: LANES[i].y }, t, turn);
    t += turn;
    moveTo(tl, tool, { x: LANES[i].dir === 1 ? 1 : 0 }, t, laneDur);
    wipe(tl, lanes[i], t, laneDur);
    t += laneDur;
  }
  return t;
}

/* ═══════════════════════════════ CARPET ═══════════════════════════════ */

export const pile = (base: string, dirty = false): CSSProperties => ({
  backgroundColor: base,
  backgroundImage: [
    noise({ freq: 1.6, octaves: 2, alpha: dirty ? 0.55 : 0.4, rgb: dirty ? "45 36 24" : "110 92 66", size: 180, seed: dirty ? 9 : 4 }),
    noise({ freq: 1.1, octaves: 1, alpha: 0.35, rgb: "255 250 240", size: 160, seed: 11 }),
    ...(dirty ? [noise({ freq: 0.012, octaves: 3, alpha: 0.6, rgb: "60 46 28", size: 600, seed: 5 })] : []),
    "radial-gradient(circle at 50% 50%, rgb(0 0 0 / 0.10) 0 2.5px, transparent 3.2px)",
  ].join(", "),
  backgroundSize: dirty ? "180px 180px, 160px 160px, 600px 600px, 6px 6px" : "180px 180px, 160px 160px, 6px 6px",
});

export function CarpetVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#3a352d] [perspective:900px]" aria-hidden>
      <div data-plane className="absolute inset-[-25%] origin-center will-change-transform [transform:rotateX(38deg)]">
        <div className="absolute inset-0" style={pile("#d3c8b4")} />
        {LANES.map((l, i) => (
          <Wipe key={i} name="lane" region={l.region} dir={l.dir}>
            <div className="absolute inset-0" style={pile("#9c907a", true)} />
          </Wipe>
        ))}
        <div data-tool className="absolute left-0 top-0 h-[26%] w-[7%] will-change-transform">
          <div className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-[#2b2f2d] via-[#4a504d] to-[#2b2f2d] shadow-[0_30px_40px_-10px_rgb(0_0_0/0.6)]" />
          <div className="absolute inset-y-[12%] left-[41%] w-[18%] rounded-full bg-[#9aa3a0]" />
        </div>
      </div>
      <div className={vignette} />
      <Label tone="light" className="left-5 top-5">Hot-water extraction · fibre-matched</Label>
    </div>
  );
}

export const carpetBuild: Build = (q, tl) => {
  const [tool] = q("[data-tool]");
  place(tool, 0, LANES[0].y);
  tl.fromTo(q("[data-plane]"), { scale: 1.12 }, { scale: 1, duration: 3.9, ease: "none" }, 0);
  const end = serpentine(tl, tool, q("[data-wipe='lane']"), 0.2);
  tl.to(tool, { autoAlpha: 0, duration: 0.2 }, end - 0.1);
};

/* ═════════════════════════════ UPHOLSTERY ═════════════════════════════ */

const velvet: CSSProperties = {
  backgroundColor: "#8fa18b",
  backgroundImage:
    "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.035) 0 1px, transparent 1px 3px)",
};

const grimeStyle: CSSProperties = {
  backgroundColor: "rgb(92 82 62 / 0.32)",
  backgroundImage: `${noise({ freq: 0.05, octaves: 3, alpha: 0.5, rgb: "70 58 40", size: 300, seed: 8 })}, ${noise({ freq: 1.2, alpha: 0.3, rgb: "60 50 35" })}, radial-gradient(ellipse at 55% 60%, rgb(80 65 45 / 0.4), transparent 38%)`,
  backgroundSize: "300px 300px, 220px 220px, 100% 100%",
  borderRadius: "inherit",
};

function Grime() {
  return <div data-grime className="absolute inset-0 will-change-[opacity]" style={grimeStyle} />;
}

function Part({ className, children, style }: { className: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`absolute overflow-hidden ${className}`} style={{ ...velvet, ...style }}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/18" />
      {children}
    </div>
  );
}

export function UpholsteryVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#ebe6dc]" aria-hidden>
      <div data-cam className="absolute inset-0 origin-[50%_66%] will-change-transform">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_30%_20%,#f6f2ea,#e4ddcf_70%)]" />
        <div className="absolute left-[38%] top-[12%] h-[22%] w-[24%] border-[6px] border-[#f7f4ee] bg-[linear-gradient(160deg,#c9cfc2,#a8b4a3_60%,#8d9a88)] shadow-md" />
        <div className="absolute right-[9%] top-[22%] h-[44%] w-px bg-[#5d564b]" />
        <div className="absolute right-[5%] top-[16%] h-[8%] w-[9%] rounded-t-full bg-[#efe6d4] shadow-[0_18px_40px_rgb(255_240_200/0.7)]" />
        <div className="absolute inset-x-0 bottom-0 h-[26%] bg-[#c9b394]" />
        <div className="absolute bottom-[4%] left-[12%] h-[14%] w-[76%] rounded-[50%] bg-[#e4dccd] opacity-90" />

        <div className="absolute bottom-[16%] left-[13%] h-[40%] w-[74%]">
          <div className="absolute inset-x-[2%] bottom-[-4%] h-[10%] rounded-[50%] bg-black/25 blur-md" />
          <Part className="inset-x-[6%] top-0 h-[60%] rounded-t-[28px]">
            <Grime />
          </Part>
          {[0, 1, 2].map((i) => (
            <Part key={`b${i}`} className="top-[6%] h-[46%] rounded-[18px] shadow-[0_6px_10px_-6px_rgb(0_0_0/0.4)]" style={{ left: `${9 + i * 27.6}%`, width: "26.8%" }}>
              <Grime />
            </Part>
          ))}
          <Part className="inset-x-0 bottom-[8%] h-[44%] rounded-[22px] shadow-[0_14px_24px_-12px_rgb(0_0_0/0.5)]">
            <Grime />
          </Part>
          {[0, 1, 2].map((i) => (
            <Part key={`s${i}`} className="bottom-[30%] h-[24%] rounded-[14px] shadow-[0_4px_8px_-4px_rgb(0_0_0/0.35)]" style={{ left: `${10 + i * 26.7}%`, width: "26.5%" }}>
              {i === 1 ? (
                <Wipe name="cushion">
                  <div className="absolute inset-0" style={grimeStyle} />
                </Wipe>
              ) : (
                <Grime />
              )}
            </Part>
          ))}
          <Part className="bottom-[8%] left-0 h-[62%] w-[10%] rounded-[20px]">
            <Grime />
          </Part>
          <Part className="bottom-[8%] right-0 h-[62%] w-[10%] rounded-[20px]">
            <Grime />
          </Part>
          <div className="absolute bottom-0 left-[8%] h-[8%] w-[1.6%] bg-[#4c3f31]" />
          <div className="absolute bottom-0 right-[8%] h-[8%] w-[1.6%] bg-[#4c3f31]" />

          <div data-tool className="absolute bottom-[42%] left-0 z-10 h-[9%] w-[5%] opacity-0 will-change-transform">
            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-[#e9ecea] to-[#9da5a2] shadow-[0_6px_10px_rgb(0_0_0/0.35)]" />
            <div className="absolute bottom-[90%] left-[39%] h-[260%] w-[22%] origin-bottom rotate-[18deg] rounded-full bg-[#3c4240]" />
          </div>
        </div>
        <div data-glow className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_60%_30%,rgb(255_248_230/0.35),transparent)] opacity-0" />
      </div>
      <Label className="left-5 top-5">Fabric code checked before every clean</Label>
    </div>
  );
}

export const upholsteryBuild: Build = (q, tl) => {
  const [tool] = q("[data-tool]");
  tl.to(q("[data-cam]"), { scale: 2.5, duration: 1, ease: "power2.inOut" }, 0);
  tl.to(tool, { autoAlpha: 1, duration: 0.15 }, 0.9);
  tl.fromTo(tool, { x: pos(tool, "x", 0.36) }, { x: pos(tool, "x", 0.6), duration: 1.4, ease: EASE }, 1.0);
  tl.fromTo(tool, { y: 0 }, { y: -5, duration: 0.175, yoyo: true, repeat: 7, ease: "sine.inOut" }, 1.0);
  wipe(tl, q("[data-wipe='cushion']")[0], 1.0, 1.4);
  tl.to(tool, { autoAlpha: 0, duration: 0.15 }, 2.4);
  tl.to(q("[data-cam]"), { scale: 1, duration: 1, ease: "power2.inOut" }, 2.5);
  tl.to(q("[data-grime]"), { autoAlpha: 0, duration: 0.7, stagger: 0.03, ease: "sine.out" }, 2.9);
  tl.to(q("[data-glow]"), { opacity: 1, duration: 0.8, ease: "sine.out" }, 3.1);
};

/* ═══════════════════════════════ WINDOW ═══════════════════════════════ */

const COLS: { region: [number, number, number, number]; dir: 1 | -1; x: number }[] = [
  { region: [0, 0, 33.34, 100], dir: 1, x: 1 / 6 },
  { region: [0, 33.33, 33.34, 100], dir: -1, x: 0.5 },
  { region: [0, 66.66, 33.34, 100], dir: 1, x: 5 / 6 },
];

function Smudges() {
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <defs>
        <filter id="sm-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="300" height="400" fill="rgb(232 228 218 / 0.5)" />
      <g filter="url(#sm-blur)" fill="rgb(255 255 255 / 0.55)">
        <ellipse cx="70" cy="120" rx="34" ry="20" />
        <ellipse cx="210" cy="250" rx="46" ry="26" />
        <ellipse cx="150" cy="70" rx="26" ry="14" />
        <ellipse cx="90" cy="320" rx="40" ry="18" />
      </g>
      <g stroke="rgb(200 195 185 / 0.7)" strokeWidth="5" fill="none" filter="url(#sm-blur)">
        <path d="M30 40 Q120 90 260 60" />
        <path d="M40 200 Q140 170 270 210" />
        <path d="M20 360 Q150 330 280 370" />
      </g>
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 73) % 300} cy={(i * 131) % 400} r={1.2 + (i % 3)} fill="rgb(255 255 255 / 0.45)" />
      ))}
    </svg>
  );
}

export function WindowVisual() {
  return (
    <div className="absolute inset-0 bg-[#ebe6dc]" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_70%_40%,#f6f2ea,#e3dccd)]" />
      <div className="absolute left-[5%] right-[5%] top-[12%] bottom-[8%] md:left-[44%] md:top-[10%] md:bottom-[10%]">
        <div className="absolute inset-0 overflow-hidden">
          <WindowView id="wv-story" className="size-full" />
          <div data-glow className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_20%,rgb(255_250_235/0.55),transparent)] opacity-0" />
          {COLS.map((c, i) => (
            <Wipe key={i} name="col" region={c.region} axis="y" dir={c.dir}>
              <Smudges />
            </Wipe>
          ))}
          <div data-tool className="absolute left-0 top-0 z-10 w-[30%] will-change-transform">
            <div className="h-[10px] rounded-full bg-gradient-to-b from-[#2f3532] to-[#1d2220] shadow-[0_4px_8px_rgb(0_0_0/0.3)]" />
            <div className="h-[3px] bg-white/70" />
            <div className="absolute bottom-full left-[44%] h-16 w-[12%] rounded-t-md bg-gradient-to-b from-[#c9a86a] to-[#a8884f]" />
          </div>
        </div>
        <WindowFrame panes={3} />
      </div>
    </div>
  );
}

export const windowBuild: Build = (q, tl) => {
  const [s] = q("[data-tool]");
  const cols = q("[data-wipe='col']");
  gsap.set(s, { xPercent: -50, x: pos(s, "x", COLS[0].x), y: 0 });
  tl.fromTo(s, { x: pos(s, "x", COLS[0].x), y: pos(s, "y", 0) }, { y: pos(s, "y", 1), duration: 1, ease: EASE }, 0.1);
  wipe(tl, cols[0], 0.1, 1);
  moveTo(tl, s, { x: COLS[1].x }, 1.1, 0.2);
  moveTo(tl, s, { y: 0 }, 1.3, 1);
  wipe(tl, cols[1], 1.3, 1);
  moveTo(tl, s, { x: COLS[2].x }, 2.3, 0.2);
  moveTo(tl, s, { y: 1 }, 2.5, 1);
  wipe(tl, cols[2], 2.5, 1);
  tl.to(s, { autoAlpha: 0, duration: 0.2 }, 3.4);
  tl.to(q("[data-glow]"), { opacity: 1, duration: 0.7, ease: "sine.out" }, 3.3);
};

/* ═══════════════════════════════ FLOOR ═══════════════════════════════ */

export const boards = (tint: string): CSSProperties => ({
  backgroundColor: tint,
  backgroundImage:
    "repeating-linear-gradient(90deg, rgb(60 35 15 / 0.35) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.06) 0 64px, rgb(0 0 0 / 0.05) 64px 128px, rgb(255 255 255 / 0.03) 128px 192px), repeating-linear-gradient(0deg, rgb(90 55 25 / 0.08) 0 2px, transparent 2px 9px)",
});

export function FloorVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#2a241e] to-[#16120f] [perspective:800px]" aria-hidden>
      <div className="absolute inset-[-170%_-60%_-10%] origin-bottom [transform:rotateX(58deg)]">
        <div className="absolute inset-0" style={boards("#b98d5f")} />
        <div data-gloss className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 will-change-transform" />
        <Wipe name="dull" axis="y" dir={-1}>
          <div
            className="absolute inset-0"
            style={{
              ...boards("#9f8a73"),
              backgroundImage: `repeating-linear-gradient(115deg, rgb(255 255 255 / 0.10) 0 1px, transparent 1px 37px), repeating-linear-gradient(70deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 53px), ${boards("").backgroundImage}`,
            }}
          />
          <div className="absolute inset-0 bg-[#8d8a84]/35" />
        </Wipe>
        <div data-tool className="absolute left-0 top-0 aspect-square w-[18%] will-change-transform">
          <div className="absolute inset-[-12%] rounded-full bg-black/40 blur-lg" />
          <div data-disc className="absolute inset-0 rounded-full bg-[conic-gradient(#3b403e,#7b8481,#3b403e,#6a7370,#3b403e)] will-change-transform" />
          <div className="absolute inset-[22%] rounded-full bg-gradient-to-br from-[#e9ece9] to-[#9ca4a1] shadow-inner" />
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_70%,transparent_30%,rgb(0_0_0/0.6))]" />
    </div>
  );
}

export const floorBuild: Build = (q, tl) => {
  const [m] = q("[data-tool]");
  const [gloss] = q("[data-gloss]");
  place(m, 0.3, 1);
  gsap.set(gloss, { skewX: -20 });
  tl.fromTo(m, { y: pos(m, "y", 1) }, { y: pos(m, "y", 0), duration: 3, ease: "none" }, 0);
  wipe(tl, q("[data-wipe='dull']")[0], 0, 3, "none");
  tl.fromTo(m, { x: pos(m, "x", 0.3) }, { x: pos(m, "x", 0.7), duration: 0.375, repeat: 7, yoyo: true, ease: "sine.inOut" }, 0);
  tl.fromTo(q("[data-disc]"), { rotate: 0 }, { rotate: 2160, duration: 3, ease: "none" }, 0);
  tl.to(m, { autoAlpha: 0, duration: 0.2 }, 2.9);
  tl.fromTo(gloss, { x: pos(gloss, "x", -0.4), opacity: 1 }, { x: pos(gloss, "x", 1.2), duration: 0.9, ease: "sine.inOut" }, 3.0);
};

/* ═════════════════════════════ TILE & GROUT ═════════════════════════════ */

export const tiles = (dirty: boolean): CSSProperties => ({
  backgroundColor: dirty ? "#cbc4b6" : "#ebe8e1",
  backgroundImage: [
    `linear-gradient(90deg, ${dirty ? "#5f5444" : "#d2cbbd"} 0 5px, transparent 5px)`,
    `linear-gradient(0deg, ${dirty ? "#5f5444" : "#d2cbbd"} 0 5px, transparent 5px)`,
    noise({ freq: dirty ? 0.03 : 0.5, octaves: 3, alpha: dirty ? 0.5 : 0.12, rgb: dirty ? "80 66 45" : "140 130 115", size: 300, seed: dirty ? 12 : 2 }),
  ].join(", "),
  backgroundSize: "130px 130px, 130px 130px, 300px 300px",
});

export function TileVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2e2b27] [perspective:900px]" aria-hidden>
      <div data-plane className="absolute inset-[-25%] origin-center will-change-transform [transform:rotateX(34deg)]">
        <div className="absolute inset-0" style={tiles(false)} />
        <div data-gloss className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 will-change-transform" />
        {LANES.map((l, i) => (
          <Wipe key={i} name="lane" region={l.region} dir={l.dir}>
            <div className="absolute inset-0" style={tiles(true)} />
          </Wipe>
        ))}
        <div data-tool className="absolute left-0 top-0 aspect-square w-[12%] will-change-transform">
          <div className="absolute inset-[-10%] rounded-full bg-black/35 blur-md" />
          <div data-disc className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(#2f3432_0_8deg,#59615e_8deg_16deg)] will-change-transform" />
          <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-[#e6eae7] to-[#98a19e]" />
        </div>
      </div>
      <div className={vignette} />
      <Label tone="light" className="left-5 top-5">Rotary clean · optional sealing</Label>
    </div>
  );
}

export const tileBuild: Build = (q, tl) => {
  const [tool] = q("[data-tool]");
  const [gloss] = q("[data-gloss]");
  place(tool, 0, LANES[0].y);
  gsap.set(gloss, { skewX: -20 });
  tl.fromTo(q("[data-plane]"), { scale: 1.1 }, { scale: 1, duration: 4.2, ease: "none" }, 0);
  const end = serpentine(tl, tool, q("[data-wipe='lane']"), 0.1);
  tl.fromTo(q("[data-disc]"), { rotate: 0 }, { rotate: 2880, duration: end, ease: "none" }, 0);
  tl.to(tool, { autoAlpha: 0, duration: 0.2 }, end - 0.1);
  tl.fromTo(gloss, { x: pos(gloss, "x", -0.4), opacity: 1 }, { x: pos(gloss, "x", 1.2), duration: 0.9, ease: "sine.inOut" }, end);
};

/* ═════════════════════════════ HOUSE WASH ═════════════════════════════ */

export function HouseVisual() {
  const cladding: CSSProperties = {
    backgroundColor: "#eeeae1",
    backgroundImage: "repeating-linear-gradient(180deg, rgb(0 0 0 / 0.10) 0 1px, rgb(255 255 255 / 0.4) 1px 2px, transparent 2px 15px)",
  };
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#c8d8db] via-[#e6ebe4] to-[#f2eee4]" />
      <div data-glow className="absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_10%,rgb(255_244_214/0.9),transparent)] opacity-0" />
      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-b from-[#7f9a78] to-[#5f7a5a]" />
      <div className="absolute bottom-[16%] left-[-5%] h-[12%] w-[40%] rounded-t-[50%] bg-[#4f6b4c]" />
      <div className="absolute bottom-[16%] right-[-6%] h-[16%] w-[30%] rounded-t-[50%] bg-[#56724f]" />

      <div className="absolute bottom-[18%] left-[13%] h-[62%] w-[74%]">
        <div className="absolute inset-x-[-6%] top-0 h-[34%] bg-[#3a403e] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        <div className="absolute inset-x-0 bottom-0 top-[32%]">
          <div className="absolute inset-0" style={cladding} />
          <div className="absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-black/20 to-transparent" />
          {[12, 66].map((l) => (
            <div key={l} className="absolute top-[18%] h-[38%] w-[22%] border-[5px] border-white bg-gradient-to-br from-[#a9c0c4] to-[#dfe7e3] shadow-sm" style={{ left: `${l}%` }}>
              <div className="absolute inset-y-0 left-1/2 w-[4px] -translate-x-1/2 bg-white" />
            </div>
          ))}
          <div className="absolute bottom-0 left-[41%] h-[62%] w-[18%] border-[5px] border-b-0 border-white bg-[#173d35]" />
          <Wipe name="grime" axis="y" dir={1}>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgb(60 75 45 / 0.45) 0%, rgb(80 92 62 / 0.2) 30%, rgb(70 82 52 / 0.3) 70%, rgb(52 66 38 / 0.5) 100%), repeating-linear-gradient(90deg, transparent 0 22px, rgb(60 70 45 / 0.16) 22px 26px, transparent 26px 61px)",
              }}
            />
          </Wipe>
          <div data-tool className="absolute left-0 top-0 z-10 w-[26%] will-change-transform">
            <div className="h-[46px] bg-[linear-gradient(180deg,rgb(255_255_255/0.7),rgb(220_235_240/0.15))] [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)]" />
            <div className="absolute bottom-full left-[48%] h-24 w-[5px] rounded bg-[#2b302e]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const houseBuild: Build = (q, tl) => {
  const [w] = q("[data-tool]");
  gsap.set(w, { xPercent: -50 });
  tl.fromTo(w, { y: pos(w, "y", 0) }, { y: pos(w, "y", 1), duration: 3, ease: "none" }, 0);
  tl.fromTo(w, { x: pos(w, "x", 0.15) }, { x: pos(w, "x", 0.85), duration: 0.5, repeat: 5, yoyo: true, ease: "sine.inOut" }, 0);
  wipe(tl, q("[data-wipe='grime']")[0], 0, 3, "none");
  tl.to(w, { autoAlpha: 0, duration: 0.2 }, 3);
  tl.to(q("[data-glow]"), { opacity: 1, duration: 0.8, ease: "sine.out" }, 3);
};

/* ═════════════════════════════ RESTORATION ═════════════════════════════ */

export function RestorationVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2a2e2c]" aria-hidden>
      <div data-glow className="absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_20%,#5d625c,#2a2e2c_70%)] will-change-[opacity]" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[#4a4640]" />
      <div data-damp className="absolute bottom-[4%] left-[18%] h-[22%] w-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(20_22_22/0.75),rgb(20_22_22/0.3)_70%,transparent)] will-change-transform" />
      <div className="absolute bottom-[14%] left-[10%] h-[30%] w-[16%] rounded-xl bg-gradient-to-b from-[#d9ddd8] to-[#aab0ab] shadow-[0_20px_30px_-10px_rgb(0_0_0/0.6)]">
        <div className="absolute inset-x-[15%] top-[15%] h-[35%] rounded bg-[repeating-linear-gradient(180deg,#59605c_0_2px,transparent_2px_6px)]" />
        <div className="absolute right-[14%] top-[62%] size-2 rounded-full bg-[#7fd1a0] shadow-[0_0_8px_#7fd1a0]" />
      </div>
      <div className="absolute bottom-[12%] right-[16%] h-[18%] w-[20%] rounded-[50%_50%_20%_20%] bg-gradient-to-b from-[#a8b8a5] to-[#7f917c] shadow-[0_20px_30px_-10px_rgb(0_0_0/0.6)]">
        <div data-fan className="absolute inset-[22%] rounded-full bg-[repeating-conic-gradient(#2f3532_0_30deg,#454c49_30deg_60deg)] will-change-transform" />
      </div>
      <div className="absolute right-5 top-5 rounded-2xl bg-ivory/95 px-5 py-4 text-forest shadow-lg">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-forest/60">Moisture reading</p>
        <p className="font-serif text-4xl tabular-nums">
          <span data-moisture>32</span>%
        </p>
        <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-forest/10">
          <div data-bar className="h-full origin-left rounded-full bg-forest will-change-transform" />
        </div>
        <p data-day className="mt-2 text-xs text-forest/60">Day 1 · monitoring</p>
      </div>
    </div>
  );
}

export const restorationBuild: Build = (q, tl) => {
  const [day] = q("[data-day]");
  counter(tl, q("[data-moisture]")[0], 32, 14, 0, 3, (v) => {
    if (day) day.textContent = `Day ${1 + Math.round(((32 - v) / 18) * 3)} · monitoring`;
    return String(Math.round(v));
  });
  tl.fromTo(q("[data-bar]"), { scaleX: 1 }, { scaleX: 0.42, duration: 3, ease: "none" }, 0);
  tl.fromTo(q("[data-damp]"), { scale: 1, opacity: 1 }, { scale: 0.35, opacity: 0.1, duration: 3, ease: "sine.inOut" }, 0);
  tl.fromTo(q("[data-glow]"), { opacity: 0.6 }, { opacity: 1, duration: 3, ease: "none" }, 0);
  tl.fromTo(q("[data-fan]"), { rotate: 0 }, { rotate: 3600, duration: 3, ease: "none" }, 0);
};

/* ═══════════════════════ RESIDENTIAL (kitchen) ═══════════════════════ */

export const marble: CSSProperties = {
  backgroundColor: "#f3f1ec",
  backgroundImage: `${noise({ freq: 0.012, octaves: 4, alpha: 0.35, rgb: "150 145 135", size: 500, seed: 21 })}, linear-gradient(180deg, rgb(255 255 255 / 0.6), transparent)`,
  backgroundSize: "500px 500px, 100% 100%",
};

const BENCH: { region: [number, number, number, number]; dir: 1 | -1; y: number }[] = [
  { region: [56, 0, 100, 5], dir: -1, y: 0.585 },
  { region: [61, 0, 100, 5], dir: 1, y: 0.635 },
];

function BenchDirt() {
  return (
    <div className="absolute inset-x-0 top-[56%] h-[10%]">
      <div className="absolute inset-0" style={{ backgroundImage: noise({ freq: 0.9, octaves: 1, alpha: 0.55, rgb: "90 70 45", seed: 30 }), backgroundSize: "220px 220px" }} />
      <div className="absolute left-[24%] top-[18%] h-[60%] w-[6%] rounded-full border-[3px] border-[#8a6a45]/45" />
      <div className="absolute left-[64%] top-[30%] h-[45%] w-[16%] rounded-[50%] bg-[#b7a98f]/40 blur-[3px]" />
      <div className="absolute left-[40%] top-[10%] h-[70%] w-[10%] rounded-[50%] bg-[#d8d2c5]/70 blur-[2px]" />
    </div>
  );
}

export function ResidentialVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eeeae2]" aria-hidden>
      {/* Shelf */}
      <div className="absolute inset-x-[8%] top-[13%] h-[1.6%] bg-[#b89470] shadow-[0_6px_10px_-6px_rgb(0_0_0/0.35)]" />
      <div className="absolute left-[16%] top-[5%] h-[8%] w-[5%] rounded-t-[40%] bg-[#d9d2c4]" />
      <div className="absolute left-[23%] top-[8%] h-[5%] w-[7%] rounded-t-[50%] bg-[#a8b8a5]" />
      <div className="absolute right-[20%] top-[6.5%] h-[6.5%] w-[4%] rounded-sm bg-[#f8f6f1] shadow-sm" />
      {/* Splashback tiles */}
      <div
        className="absolute inset-x-0 top-[20%] h-[36%]"
        style={{
          backgroundColor: "#f7f5f0",
          backgroundImage: "linear-gradient(#dcd6ca 1px, transparent 1px), linear-gradient(90deg, #dcd6ca 1px, transparent 1px)",
          backgroundSize: "64px 32px",
        }}
      />
      <Wipe name="splash" region={[20, 0, 100, 36]}>
        <div
          className="absolute inset-x-0 top-[20%] h-[36%]"
          style={{
            backgroundColor: "rgb(196 168 110 / 0.2)",
            backgroundImage: noise({ freq: 0.04, octaves: 3, alpha: 0.4, rgb: "150 120 70", seed: 31, size: 400 }),
            backgroundSize: "400px 400px",
          }}
        />
      </Wipe>
      {/* Spray mist */}
      {[18, 42, 70].map((l) => (
        <div key={l} data-mist className="absolute top-[28%] h-[20%] w-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.85),transparent)] opacity-0 will-change-[opacity]" style={{ left: `${l}%` }} />
      ))}
      {/* Tap */}
      <svg viewBox="0 0 60 120" className="absolute left-[56%] top-[33%] h-[24%] w-auto" aria-hidden>
        <defs>
          <linearGradient id="chrome" x1="0" x2="1">
            <stop offset="0" stopColor="#8d9491" />
            <stop offset=".45" stopColor="#f4f6f5" />
            <stop offset="1" stopColor="#7c8380" />
          </linearGradient>
        </defs>
        <path d="M30 118 V40 Q30 8 8 10 V24" fill="none" stroke="url(#chrome)" strokeWidth="7" strokeLinecap="round" />
        <rect x="20" y="104" width="20" height="14" rx="3" fill="url(#chrome)" />
      </svg>
      <div data-sparkle className="absolute left-[56.4%] top-[34%] size-6 opacity-0 will-change-transform">
        <span className="absolute left-[11px] top-0 h-full w-[2px] bg-white shadow-[0_0_8px_white]" />
        <span className="absolute left-0 top-[11px] h-[2px] w-full bg-white shadow-[0_0_8px_white]" />
      </div>
      {/* Bench */}
      <div className="absolute inset-x-0 top-[56%] h-[10%]" style={marble} />
      {BENCH.map((b, i) => (
        <Wipe key={i} name="bench" region={b.region} dir={b.dir}>
          <BenchDirt />
        </Wipe>
      ))}
      <div className="absolute inset-x-0 top-[66%] h-[3%] bg-gradient-to-b from-[#e6e2da] to-[#cfcac0]" />
      {/* Cabinets */}
      <div className="absolute inset-x-0 bottom-0 top-[69%] bg-[#93a38f]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="absolute bottom-[8%] top-[8%] rounded-sm border-[6px] border-[#a3b29f] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ left: `${3 + i * 24.5}%`, width: "22.5%" }}>
            <div className="absolute left-[37%] top-[12%] h-[4px] w-[26%] rounded-full bg-[#d9cdb5]" />
          </div>
        ))}
      </div>
      {/* Cloth */}
      <div data-tool className="absolute left-0 top-0 z-10 h-[9%] w-[11%] will-change-transform">
        <div className="absolute inset-0 rounded-[30%] bg-[#7f98a6] shadow-[0_10px_18px_-6px_rgb(0_0_0/0.4)]" style={{ backgroundImage: noise({ freq: 1.4, alpha: 0.3, rgb: "40 60 70", seed: 33 }) }} />
        <div className="absolute inset-x-[15%] top-[35%] h-[2px] rounded bg-white/25" />
        <div className="absolute inset-x-[25%] top-[60%] h-[2px] rounded bg-black/15" />
      </div>
      <div data-light className="pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 will-change-transform" />
      <Label className="left-5 top-5">Room-by-room checklist</Label>
    </div>
  );
}

export const residentialBuild: Build = (q, tl) => {
  const [cloth] = q("[data-tool]");
  const [light] = q("[data-light]");
  const benches = q("[data-wipe='bench']");
  place(cloth, -0.1, 0.38);
  gsap.set(light, { skewX: -18 });
  // Spray
  q("[data-mist]").forEach((m, i) => {
    tl.fromTo(m, { opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1, duration: 0.25, ease: "sine.out" }, 0.1 + i * 0.12);
    tl.to(m, { opacity: 0, duration: 0.3, ease: "sine.in" }, 0.75 + i * 0.35);
  });
  // Splashback pass →
  tl.fromTo(cloth, { x: pos(cloth, "x", -0.1), y: pos(cloth, "y", 0.38) }, { x: pos(cloth, "x", 1.02), duration: 1.3, ease: EASE }, 0.5);
  wipe(tl, q("[data-wipe='splash']")[0], 0.55, 1.2);
  // Bench lane ←, then →
  moveTo(tl, cloth, { y: BENCH[0].y }, 1.8, 0.25);
  moveTo(tl, cloth, { x: 0 }, 2.05, 1);
  wipe(tl, benches[0], 2.05, 1);
  moveTo(tl, cloth, { y: BENCH[1].y }, 3.05, 0.2);
  moveTo(tl, cloth, { x: 1.12 }, 3.25, 1.1);
  wipe(tl, benches[1], 3.25, 1);
  tl.fromTo(cloth, { rotate: -6 }, { rotate: 6, duration: 0.3, repeat: 12, yoyo: true, ease: "sine.inOut" }, 0.5);
  // Finish: sparkle + light sweep
  const [spark] = q("[data-sparkle]");
  tl.fromTo(spark, { opacity: 0, scale: 0, rotate: 0 }, { opacity: 1, scale: 1.2, rotate: 45, duration: 0.25, ease: "back.out(2)" }, 4.3);
  tl.to(spark, { opacity: 0, scale: 0.4, duration: 0.25, ease: "sine.in" }, 4.6);
  tl.fromTo(light, { x: pos(light, "x", -0.4), opacity: 1 }, { x: pos(light, "x", 1.2), duration: 0.8, ease: "sine.inOut" }, 4.3);
};

/* ═══════════════════════ COMMERCIAL (office, top-down) ═══════════════════════ */

const DESK_X = [14, 38, 62, 86];
const DESK_Y = [26, 72];

export function CommercialVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1d2326]" aria-hidden>
      <div className="absolute inset-[7%] rounded-md border-[6px] border-[#3a4246] bg-[#2b3236]">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute inset-x-[4%] -top-[6px] h-[6px] bg-[#7fa3b3]" />
        {DESK_X.map((x) => (
          <div key={x} data-zone className="absolute inset-y-0 w-[30%] bg-[radial-gradient(closest-side,rgb(255_244_220/0.32),transparent)] opacity-0 will-change-[opacity]" style={{ left: `${x - 15}%` }} />
        ))}
        {/* Aisle: polished floor under a dull layer the scrubber wipes away */}
        <div className="absolute inset-x-[2%] top-[44%] h-[10%] bg-gradient-to-b from-[#465056] via-[#5d686e] to-[#465056]" />
        <Wipe name="aisle" region={[44, 2, 96, 10]}>
          <div className="absolute inset-x-[2%] top-[44%] h-[10%] bg-[#353d41]" />
        </Wipe>
        {DESK_Y.map((y) =>
          DESK_X.map((x) => (
            <div key={`${x}-${y}`} className="absolute h-[18%] w-[18%]" style={{ left: `${x - 9}%`, top: `${y - 9}%` }}>
              <div className="absolute inset-0 rounded-[4px] bg-[#c9bba3] shadow-[0_6px_14px_rgb(0_0_0/0.4)]" />
              <div className="absolute inset-x-[25%] top-[12%] h-[10%] rounded-sm bg-[#22282b]" />
              <div className="absolute left-[36%] top-[58%] size-[28%] rounded-full bg-[#4c5559]" />
              <div data-dust={x} className="absolute inset-0 rounded-[4px] will-change-[opacity]" style={{ backgroundColor: "rgb(70 66 58 / 0.45)", backgroundImage: noise({ freq: 0.8, alpha: 0.45, rgb: "40 36 30", seed: x + y }) }} />
              <div data-check={x} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-sage text-forest-deep opacity-0 shadow will-change-transform">
                <Check className="size-3.5" strokeWidth={3} />
              </div>
            </div>
          )),
        )}
        <div data-tool className="absolute left-0 top-0 z-10 flex gap-1 will-change-transform">
          <span className="size-3.5 rounded-full bg-ivory shadow-[0_0_16px_rgb(255_255_255/0.7)]" />
          <span className="size-3.5 rounded-full bg-sage shadow-[0_0_16px_rgb(168_184_165/0.7)]" />
        </div>
      </div>
      <div className="absolute right-5 top-5 rounded-2xl bg-ivory/95 px-5 py-3 text-forest shadow-lg">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-forest/60">After hours</p>
        <p data-clock className="font-serif text-3xl tabular-nums">6:00 pm</p>
        <p data-ready className="text-xs text-forest/60">Cleaning in progress</p>
      </div>
    </div>
  );
}

export const commercialBuild: Build = (q, tl) => {
  const [team] = q("[data-tool]");
  const [ready] = q("[data-ready]");
  place(team, 0.02, 0.49);
  const D = 3.2;
  tl.fromTo(team, { x: pos(team, "x", 0.02) }, { x: pos(team, "x", 0.98), duration: D, ease: "none" }, 0.2);
  wipe(tl, q("[data-wipe='aisle']")[0], 0.2, D, "none");
  counter(tl, q("[data-clock]")[0], 18 * 60, 21.5 * 60, 0, D + 0.6, (m) => {
    const mins = Math.round(m / 5) * 5;
    const h = Math.floor(mins / 60) % 12 || 12;
    if (ready) ready.textContent = mins >= 21.5 * 60 ? "Ready for the morning" : "Cleaning in progress";
    return `${h}:${String(mins % 60).padStart(2, "0")} pm`;
  });
  q("[data-zone]").forEach((z, i) => {
    tl.fromTo(z, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "sine.out" }, 0.2 + (DESK_X[i] / 100) * D - 0.35);
  });
  DESK_X.forEach((x) => {
    const at = 0.2 + (x / 100) * D;
    tl.to(q(`[data-dust='${x}']`), { opacity: 0, duration: 0.35, ease: "sine.out" }, at - 0.1);
    tl.fromTo(q(`[data-check='${x}']`), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, at + 0.15);
  });
  tl.to(team, { autoAlpha: 0, duration: 0.2 }, D + 0.2);
};

/* ═══════════════════════════════ PAINTING ═══════════════════════════════ */

const PAINT_COLS = [0, 1, 2, 3].map((c) => ({
  region: [7, c * 25, 25.01, 83] as [number, number, number, number],
  dir: (c % 2 ? 1 : -1) as 1 | -1,
  x: c * 0.25 + 0.125,
}));

export function OldWall() {
  return (
    <div
      className="absolute inset-x-0 top-[7%] h-[83%]"
      style={{
        backgroundColor: "#d8cfbe",
        backgroundImage: `${noise({ freq: 0.02, octaves: 3, alpha: 0.35, rgb: "120 100 75", seed: 40, size: 500 })}, ${noise({ freq: 1, alpha: 0.2, rgb: "90 75 55", seed: 41 })}`,
        backgroundSize: "500px 500px, 220px 220px",
      }}
    >
      {/* Where a picture used to hang */}
      <div className="absolute left-[32%] top-[20%] h-[30%] w-[20%] bg-[#e4dccd]" />
      <div className="absolute bottom-[6%] left-[12%] h-[3%] w-[14%] -rotate-3 rounded-full bg-[#6b5d4a]/25 blur-[1px]" />
      <div className="absolute bottom-[10%] left-[58%] h-[2%] w-[10%] rotate-2 rounded-full bg-[#6b5d4a]/25 blur-[1px]" />
    </div>
  );
}

export function PaintingVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f4f1ea]" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[7%] bg-[#f8f6f1] shadow-[0_3px_6px_-3px_rgb(0_0_0/0.2)]" />
      {/* Fresh coat underneath */}
      <div className="absolute inset-x-0 top-[7%] h-[83%]" style={{ backgroundColor: "#7f9483", backgroundImage: noise({ freq: 0.7, alpha: 0.12, rgb: "40 60 45", seed: 42 }) }} />
      <div data-wet className="absolute inset-x-0 top-[7%] h-[83%] bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.18)_45%,transparent_60%)] will-change-[opacity]" />
      <div data-art className="absolute left-[32%] top-[23%] h-[25%] w-[20%] border-[7px] border-[#f7f4ee] bg-[linear-gradient(160deg,#e9dfcc,#cdb994_55%,#a88f68)] opacity-0 shadow-[0_14px_24px_-10px_rgb(0_0_0/0.45)] will-change-transform" />
      {PAINT_COLS.map((c, i) => (
        <Wipe key={i} name="paint" region={c.region} axis="y" dir={c.dir}>
          <OldWall />
        </Wipe>
      ))}
      {/* Masking tape */}
      <div data-tape className="absolute inset-x-0 top-[7%] h-[1.8%] origin-right bg-[#e7d58f] will-change-transform" />
      <div data-tape className="absolute inset-x-0 top-[88.2%] h-[1.8%] origin-right bg-[#e7d58f] will-change-transform" />
      <div className="absolute inset-x-0 top-[90%] h-[5%] bg-[#faf8f3] shadow-[0_-1px_0_rgb(0_0_0/0.06)]" />
      <div className="absolute inset-x-0 bottom-0 h-[5%] bg-[#c7ad8a]" />
      {/* Roller */}
      <div data-tool className="absolute left-0 top-0 z-10 h-[6%] w-[14%] will-change-transform">
        <div
          className="absolute inset-0 rounded-full bg-[#7f9483] shadow-[0_8px_14px_-6px_rgb(0_0_0/0.5)]"
          style={{ backgroundImage: `${noise({ freq: 1.5, alpha: 0.4, rgb: "40 60 45", seed: 43 })}, linear-gradient(180deg, rgb(255 255 255 / 0.25), transparent 50%, rgb(0 0 0 / 0.2))` }}
        />
        <div className="absolute left-[96%] top-[40%] h-[20%] w-[12%] bg-[#9aa19e]" />
        <div className="absolute left-[106%] top-[40%] h-[260%] w-[5%] bg-[#9aa19e]" />
        <div className="absolute left-[102%] top-[290%] h-[300%] w-[12%] rounded-full bg-[#2f3532]" />
      </div>
      <Label className="left-5 top-5">Prepared, protected, two coats</Label>
    </div>
  );
}

export const paintingBuild: Build = (q, tl) => {
  const [roller] = q("[data-tool]");
  const cols = q("[data-wipe='paint']");
  const top = 0.1;
  const bottom = 0.87;
  place(roller, PAINT_COLS[0].x, bottom);
  let t = 0.1;
  PAINT_COLS.forEach((c, i) => {
    const from = c.dir === -1 ? bottom : top;
    const to = c.dir === -1 ? top : bottom;
    if (i === 0) {
      tl.fromTo(roller, { x: pos(roller, "x", c.x), y: pos(roller, "y", from) }, { y: pos(roller, "y", to), duration: 0.8, ease: EASE }, t);
    } else {
      moveTo(tl, roller, { x: c.x }, t - 0.2, 0.2);
      moveTo(tl, roller, { y: to }, t, 0.8);
    }
    wipe(tl, cols[i], t, 0.8);
    t += 1;
  });
  tl.to(roller, { autoAlpha: 0, duration: 0.2 }, t - 0.2);
  tl.to(q("[data-tape]"), { scaleX: 0, duration: 0.5, stagger: 0.1, ease: "power2.in" }, t);
  tl.to(q("[data-wet]"), { opacity: 0, duration: 0.6, ease: "sine.out" }, t);
  tl.fromTo(q("[data-art]"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.45, ease: "sine.out" }, t + 0.4);
};
