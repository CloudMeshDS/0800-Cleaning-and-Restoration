"use client";

import { useRef } from "react";
import { gsap, useGSAP, MQ } from "@/lib/gsap";

/**
 * A soapy film on the "window" in front of the hero photo. A squeegee clears it
 * in a window cleaner's S-pattern when the page opens, then rests in the sky.
 * The SVG starts hidden so the finished state never flashes before the wipe.
 */

const VARIANTS = [
  {
    key: "wide",
    show: "hidden md:block",
    box: "0 0 1600 900",
    blade: 215,
    path: "M -140 640 L 1380 640 C 1530 640 1530 425 1380 425 L 220 425 C 70 425 70 210 220 210 L 1290 210",
    drops: [1600, 900],
  },
  {
    key: "narrow",
    show: "md:hidden",
    box: "0 0 420 900",
    blade: 110,
    path: "M -70 370 L 320 370 C 390 370 390 265 320 265 L 100 265 C 30 265 30 160 100 160 L 300 160",
    drops: [420, 480],
  },
];

/** Repeatable scatter, so the server and browser draw the same droplets. */
const noise = (n: number) => Math.round((Math.sin(n * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1000) / 1000;

export function GlassWipe() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const svg = [...root.current!.querySelectorAll("svg")].find((s) => s.getClientRects().length);
      if (!svg) return;
      const path = svg.querySelector<SVGPathElement>("[data-pass]")!;
      const tool = svg.querySelector<SVGGElement>("[data-tool]")!;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;

      const place = (d: number) => {
        path.style.strokeDashoffset = `${length - d}`;
        const a = path.getPointAtLength(d);
        const b = path.getPointAtLength(Math.max(d - 3, 0));
        const turn = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI;
        tool.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${turn})`);
      };

      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const pos = { d: 0 };
        place(0);
        gsap.set(svg, { autoAlpha: 1 });
        gsap.to(pos, {
          d: length,
          duration: 5,
          delay: document.documentElement.classList.contains("intro") ? 2.6 : 0.8,
          ease: "sine.inOut",
          onUpdate: () => place(pos.d),
        });
      });
      mm.add(MQ.reduced, () => {
        place(length);
        gsap.set(svg, { autoAlpha: 1 });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="pointer-events-none absolute inset-0" aria-hidden>
      {VARIANTS.map((v) => {
        const scale = v.blade / 215;
        return (
          <svg key={v.key} viewBox={v.box} preserveAspectRatio="xMidYMid slice" className={`invisible absolute inset-0 size-full opacity-0 ${v.show}`}>
            <defs>
              <linearGradient id={`soap-${v.key}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
                <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
              </linearGradient>
              <linearGradient id={`steel-${v.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8b9190" />
                <stop offset="0.5" stopColor="#eef0ee" />
                <stop offset="1" stopColor="#a4aaa8" />
              </linearGradient>
              <mask id={`wiped-${v.key}`} maskUnits="userSpaceOnUse" x="-200" y="-200" width="2000" height="1300">
                <rect x="-200" y="-200" width="2000" height="1300" fill="#fff" />
                <path data-pass d={v.path} fill="none" stroke="#000" strokeWidth={v.blade} strokeLinecap="round" strokeLinejoin="round" />
              </mask>
            </defs>

            <g mask={`url(#wiped-${v.key})`}>
              <rect x="-200" y="-200" width="2000" height="1300" fill={`url(#soap-${v.key})`} />
              {Array.from({ length: 70 }, (_, i) => (
                <circle key={i} cx={noise(i + 1) * v.drops[0]} cy={noise(i + 101) * v.drops[1]} r={(1.5 + noise(i + 201) * 4.5) * Math.max(scale, 0.7)} fill="#fff" fillOpacity={0.3 + noise(i + 301) * 0.4} />
              ))}
            </g>

            {/* Squeegee: the blade leads, the handle trails */}
            <g data-tool>
              <g transform={`scale(${scale})`}>
                <rect x="-168" y="-10" width="150" height="20" rx="10" fill="#173d35" />
                <rect x="-34" y="-13" width="16" height="26" rx="3" fill="#b08d57" />
                <rect x="-20" y="-107" width="20" height="214" rx="6" fill={`url(#steel-${v.key})`} />
                <rect x="0" y="-110" width="7" height="220" rx="3" fill="#15191a" />
              </g>
            </g>
          </svg>
        );
      })}
    </div>
  );
}
