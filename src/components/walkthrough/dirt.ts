import * as THREE from "three";
import { toTexture } from "./textures";

/**
 * A flat (or gently folded) rectangle in the world, described by its
 * bottom-left corner `o` and edge vectors `u` (left → right as the camera
 * sees it) and `v` (bottom → top). `n` faces the camera.
 * Points on it are addressed in canvas space: x 0–1 left → right,
 * y 0–1 top → bottom, matching the grime and mask canvases.
 */
export interface Surface {
  o: THREE.Vector3;
  u: THREE.Vector3;
  v: THREE.Vector3;
  n: THREE.Vector3;
  /** Width and height in metres. */
  wm: number;
  hm: number;
  /** Offset along `n` across the width (curtain folds). */
  bump?: (x: number) => number;
}

type V = [number, number, number];

export function surface(o: V, u: V, v: V, bump?: (x: number) => number): Surface {
  const U = new THREE.Vector3(...u);
  const W = new THREE.Vector3(...v);
  return { o: new THREE.Vector3(...o), u: U, v: W, n: U.clone().cross(W).normalize(), wm: U.length(), hm: W.length(), bump };
}

export function pointOn(s: Surface, x: number, y: number, lift = 0, out = new THREE.Vector3()) {
  out.copy(s.o).addScaledVector(s.u, x).addScaledVector(s.v, 1 - y);
  return out.addScaledVector(s.n, lift + (s.bump ? s.bump(x) : 0));
}

/** A mesh-ready rectangle covering the surface, UVs matching the canvases. */
export function quad(s: Surface, lift = 0, segX = 1) {
  const g = new THREE.PlaneGeometry(1, 1, segX, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 0.5;
    const yUp = p.getY(i) + 0.5;
    pointOn(s, x, 1 - yUp, lift, tmp);
    p.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/**
 * Professional stroke pattern over a surface, in canvas space.
 * "down" = parallel strokes running top ↔ bottom, stepping left → right;
 * "across" = strokes running left ↔ right, stepping from the top.
 */
export function strokes(s: Surface, brushM: number, dir: "down" | "across", reverse = false): [number, number][] {
  const pts: [number, number][] = [];
  if (dir === "down") {
    const n = Math.max(1, Math.ceil(s.wm / (brushM * 0.8)));
    const m = Math.min(0.2, (brushM * 0.3) / s.hm);
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      const down = (i % 2 === 0) !== reverse;
      pts.push([x, down ? m : 1 - m], [x, down ? 1 - m : m]);
    }
  } else {
    const n = Math.max(1, Math.ceil(s.hm / (brushM * 0.8)));
    const m = Math.min(0.2, (brushM * 0.3) / s.wm);
    for (let i = 0; i < n; i++) {
      const y = reverse ? 1 - (i + 0.5) / n : (i + 0.5) / n;
      const right = i % 2 === 0;
      pts.push([right ? m : 1 - m, y], [right ? 1 - m : m, y]);
    }
  }
  return pts;
}

/**
 * Grime over a surface, revealed through a mask that the tool erases along
 * its stroke path. `set(t)` redraws the mask for t = 0 (dirty) … 1 (clean),
 * so scrolling backwards brings the dirt back exactly.
 */
export class Dirt {
  readonly mesh: THREE.Mesh;
  /** Path length in metres. */
  readonly length: number;
  private readonly g: CanvasRenderingContext2D;
  private readonly tex: THREE.CanvasTexture;
  private readonly W: number;
  private readonly H: number;
  private readonly cum: number[] = [0];
  private readonly brushPx: number;
  private t = -1;

  constructor(
    readonly s: Surface,
    grime: HTMLCanvasElement,
    readonly pts: [number, number][],
    brushM: number,
    opts: { segX?: number; roughness?: number; side?: THREE.Side } = {},
  ) {
    this.W = 512;
    this.H = Math.max(32, Math.round((512 * s.hm) / s.wm));
    const mask = document.createElement("canvas");
    mask.width = this.W;
    mask.height = this.H;
    this.g = mask.getContext("2d")!;
    this.tex = toTexture(mask, [1, 1], false);
    this.brushPx = (brushM / s.wm) * this.W;
    for (let i = 1; i < pts.length; i++) {
      const dx = (pts[i][0] - pts[i - 1][0]) * s.wm;
      const dy = (pts[i][1] - pts[i - 1][1]) * s.hm;
      this.cum.push(this.cum[i - 1] + Math.hypot(dx, dy));
    }
    this.length = this.cum[this.cum.length - 1];
    const mat = new THREE.MeshStandardMaterial({
      map: toTexture(grime),
      alphaMap: this.tex,
      transparent: true,
      depthWrite: false,
      roughness: opts.roughness ?? 1,
      metalness: 0,
      side: opts.side ?? THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.Mesh(quad(s, 0.004, opts.segX ?? 1), mat);
    this.mesh.renderOrder = 2;
    this.set(0);
  }

  /** Canvas-space point and travel direction at progress t. */
  at(t: number): { x: number; y: number; dx: number; dy: number } {
    const d = Math.min(Math.max(t, 0), 1) * this.length;
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const a = this.pts[i - 1];
    const b = this.pts[i];
    const seg = this.cum[i] - this.cum[i - 1] || 1;
    const k = Math.min(1, Math.max(0, (d - this.cum[i - 1]) / seg));
    return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, dx: b[0] - a[0], dy: b[1] - a[1] };
  }

  /** Returns true when the mask changed. */
  set(t: number) {
    t = Math.min(Math.max(t, 0), 1);
    if (Math.abs(t - this.t) < 1e-5) return false;
    this.t = t;
    const { g, W, H } = this;
    g.shadowBlur = 0;
    g.fillStyle = t >= 1 ? "#000" : "#fff";
    g.fillRect(0, 0, W, H);
    if (t > 0 && t < 1) {
      const end = this.at(t);
      const d = t * this.length;
      g.strokeStyle = "#000";
      g.lineWidth = this.brushPx;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.shadowColor = "#000";
      g.shadowBlur = this.brushPx * 0.3;
      g.beginPath();
      g.moveTo(this.pts[0][0] * W, this.pts[0][1] * H);
      for (let i = 1; i < this.pts.length && this.cum[i] < d; i++) g.lineTo(this.pts[i][0] * W, this.pts[i][1] * H);
      g.lineTo(end.x * W, end.y * H);
      g.stroke();
    }
    this.tex.needsUpdate = true;
    return true;
  }
}
