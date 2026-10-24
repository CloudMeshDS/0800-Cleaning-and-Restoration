"use client";

/**
 * Motion primitives that keep every scroll animation on the GPU compositor:
 *
 * - <Wipe> + wipe(): reveal/hide a layer with two counter-moving transforms
 *   (outer slides away, inner slides back) instead of animating clip-path,
 *   which would repaint large textures on every frame.
 * - pos(): position a tool with x/y transforms measured from its parent,
 *   instead of animating left/top, which forces layout on every frame.
 */

import type { ReactNode } from "react";
import { gsap } from "@/lib/gsap";

/** Default easing for a tool and the surface it reveals – they must match to stay in sync. */
export const EASE = "sine.inOut";

/**
 * A layer that can be wiped away along one axis.
 * `region` = [top, left, width, height] in % of the parent.
 * `dir` = 1 wipes towards +axis (revealing from the start edge), -1 the reverse.
 */
export function Wipe({
  name,
  region = [0, 0, 100, 100],
  axis = "x",
  dir = 1,
  className = "",
  flat = false,
  children,
}: {
  name: string;
  /** Inside a CSS-3D scene: skip GPU promotion so 3D depth sorting stays correct. */
  flat?: boolean;
  region?: [number, number, number, number];
  axis?: "x" | "y";
  dir?: 1 | -1;
  className?: string;
  children: ReactNode;
}) {
  const [t, l, w, h] = region;
  return (
    <div
      data-wipe={name}
      data-axis={axis}
      data-dir={dir}
      data-span={axis === "x" ? w : h}
      className={`absolute overflow-hidden ${flat ? "" : "will-change-transform"} ${className}`}
      style={{ top: `${t}%`, left: `${l}%`, width: `${w}%`, height: `${h}%` }}
    >
      <div
        className={flat ? "absolute" : "absolute will-change-transform"}
        style={{ top: `${(-t / h) * 100}%`, left: `${(-l / w) * 100}%`, width: `${10000 / w}%`, height: `${10000 / h}%` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Add a wipe of a <Wipe> layer to a timeline. */
export function wipe(tl: gsap.core.Timeline, outer: HTMLElement | undefined, at: number, duration: number, ease = EASE) {
  if (!outer) return;
  const inner = outer.firstElementChild as HTMLElement;
  const dir = Number(outer.dataset.dir);
  const span = Number(outer.dataset.span);
  const key = outer.dataset.axis === "y" ? "yPercent" : "xPercent";
  tl.fromTo(outer, { [key]: 0 }, { [key]: 100 * dir, duration, ease }, at);
  tl.fromTo(inner, { [key]: 0 }, { [key]: -dir * span, duration, ease }, at);
}

/** A function value: `frac` of the element's parent width/height, re-measured on refresh. */
export const pos = (el: HTMLElement, axis: "x" | "y", frac: number) => () => {
  const p = el.parentElement!;
  return (axis === "x" ? p.clientWidth : p.clientHeight) * frac;
};

/** Centre a tool on a point given as fractions of its parent. */
export function place(el: HTMLElement | undefined, fx: number, fy: number) {
  if (!el) return;
  gsap.set(el, { xPercent: -50, yPercent: -50, x: pos(el, "x", fx), y: pos(el, "y", fy) });
}

/** Move a tool to a point given as fractions of its parent. */
export function moveTo(tl: gsap.core.Timeline, el: HTMLElement | undefined, to: { x?: number; y?: number }, at: number, duration: number, ease = EASE) {
  if (!el) return;
  const vars: gsap.TweenVars = { duration, ease };
  if (to.x !== undefined) vars.x = pos(el, "x", to.x);
  if (to.y !== undefined) vars.y = pos(el, "y", to.y);
  tl.to(el, vars, at);
}

/** Count a number up/down inside an element as the timeline plays. */
export function counter(tl: gsap.core.Timeline, el: HTMLElement | undefined, from: number, to: number, at: number, duration: number, format: (n: number) => string) {
  const proxy = { v: from };
  tl.fromTo(
    proxy,
    { v: from },
    {
      v: to,
      duration,
      ease: "none",
      onUpdate: () => {
        if (el) el.textContent = format(proxy.v);
      },
    },
    at,
  );
}
