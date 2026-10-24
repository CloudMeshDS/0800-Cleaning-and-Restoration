import type { CSSProperties } from "react";
import { noise } from "@/lib/textures";

/**
 * A curtain built from individual pleats. Each pleat is shaded like a soft
 * cylinder so the panel reads as real folded fabric, and each can be animated
 * independently (`[data-pleat]`) – which is what lets the signature sequence
 * release and rehang the curtain hook by hook.
 */
export function Curtain({
  pleats = 7,
  side = "left",
  hue = "#d9cfbd",
  sway = false,
  hooks = false,
  dust = false,
  flat = false,
  className = "",
  style,
}: {
  pleats?: number;
  side?: "left" | "right";
  hue?: string;
  /** Ambient breeze (CSS only). */
  sway?: boolean;
  /** Render hook rings at the top of each pleat. */
  hooks?: boolean;
  /** Render a dusty, dulled overlay on each pleat (`[data-dust]`). */
  dust?: boolean;
  /** Inside a CSS-3D scene: skip GPU promotion so depth sorting stays correct. */
  flat?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div data-curtain={side} className={`flex ${className.includes("absolute") ? "" : "relative h-full"} ${className}`} style={style} aria-hidden>
      {Array.from({ length: pleats }).map((_, i) => {
        // Pleats nearest the window edge are slightly narrower (gathered fabric).
        const t = side === "left" ? i / (pleats - 1) : 1 - i / (pleats - 1);
        const grow = 1 + (1 - t) * 0.35;
        return (
          <div key={i} data-pleat={i} className={`relative h-full origin-top ${flat ? "" : "will-change-transform"}`} style={{ flexGrow: grow, flexBasis: 0 }}>
            {hooks && (
              <span data-hook className="absolute left-1/2 top-[-9px] z-10 -ml-[6px] block size-[12px] rounded-full border-2 border-[#7d776b] bg-transparent" />
            )}
            <div
              className={`absolute inset-0 rounded-b-[3px] ${sway ? "animate-sway" : ""}`}
              style={{
                backgroundColor: hue,
                boxShadow: "inset 0 -10px 12px -10px rgb(0 0 0 / 0.25)",
                backgroundImage: `repeating-linear-gradient(0deg, rgb(0 0 0 / 0.035) 0 1px, transparent 1px 3px), linear-gradient(90deg, rgb(0 0 0 / 0.18) 0%, rgb(255 255 255 / 0.22) 32%, rgb(255 255 255 / 0.32) 45%, rgb(0 0 0 / 0.04) 70%, rgb(0 0 0 / 0.22) 100%), linear-gradient(180deg, rgb(0 0 0 / 0.12) 0%, transparent 8%, transparent 92%, rgb(0 0 0 / 0.1) 100%)`,
                animationDelay: sway ? `${-i * 0.55}s` : undefined,
              }}
            />
            {dust && (
              <div
                data-dust
                className="absolute inset-0 rounded-b-[3px]"
                style={{
                  backgroundColor: "rgb(96 86 66 / 0.24)",
                  backgroundImage:
                    `${noise({ freq: 0.06, octaves: 3, alpha: 0.5, rgb: "90 78 55", seed: 3 + i, size: 300 })}, ${noise({ freq: 1.1, alpha: 0.3, rgb: "70 60 45" })}, linear-gradient(180deg, transparent 60%, rgb(110 100 80 / 0.25))`,
                  backgroundSize: "300px 300px, 220px 220px, 100% 100%",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
