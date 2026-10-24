import * as THREE from "three";

/**
 * Every surface texture in the walkthrough is painted here on a canvas, so
 * the 3D home needs no image downloads at all.
 */

/** Small seeded random generator, so textures are identical on every visit. */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

export function makeCanvas(w: number, h: number, draw: Draw) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  draw(c.getContext("2d")!, c.width, c.height);
  return c;
}

export function toTexture(c: HTMLCanvasElement, repeat: [number, number] = [1, 1], color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, r: () => number, color: (r: () => number) => string, size = 1.4) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = color(r);
    g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()));
  }
}

function blot(g: CanvasRenderingContext2D, x: number, y: number, rad: number, inner: string, outer = "rgba(0,0,0,0)") {
  const grd = g.createRadialGradient(x, y, 0, x, y, rad);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
}

/* ─────────────────────────── Materials ─────────────────────────── */

/** Wide-plank oak: 8 planks per texture (≈ 0.18 m each when repeated every 1.44 m). */
export const timber = () =>
  makeCanvas(1024, 1024, (g, w, h) => {
    const r = rng(7);
    const rows = 8;
    const ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * w * 0.6;
      while (x < w) {
        const len = w * (0.5 + r() * 0.55);
        const hue = 31 + r() * 5;
        const l = 60 + r() * 9;
        g.save();
        g.beginPath();
        g.rect(x, i * ph, len, ph);
        g.clip();
        g.fillStyle = hsl(hue, 34 + r() * 8, l);
        g.fillRect(x, i * ph, len, ph);
        for (let k = 0; k < 34; k++) {
          const y0 = i * ph + r() * ph;
          g.strokeStyle = hsl(hue, 38, l - 10 - r() * 12, 0.18 + r() * 0.22);
          g.lineWidth = 0.6 + r() * 1.6;
          g.beginPath();
          g.moveTo(x, y0);
          g.bezierCurveTo(x + len * 0.3, y0 + (r() - 0.5) * 9, x + len * 0.7, y0 + (r() - 0.5) * 9, x + len, y0 + (r() - 0.5) * 5);
          g.stroke();
        }
        for (let k = 0; k < 2; k++) blot(g, x + r() * len, i * ph + r() * ph, 6 + r() * 8, hsl(hue, 40, l - 18, 0.35));
        g.restore();
        g.fillStyle = "rgba(60,40,20,0.55)";
        g.fillRect(x + len - 1.5, i * ph, 1.5, ph);
        x += len;
      }
      g.fillStyle = "rgba(60,40,20,0.5)";
      g.fillRect(0, i * ph, w, 1.4);
    }
  });

type TileOpts = { w: number; h: number; cols: number; rows: number; gap: number; brick?: boolean; grout: string; color: (r: () => number) => string; seed?: number; glaze?: number };

export const tiles = (o: TileOpts) =>
  makeCanvas(o.w, o.h, (g, w, h) => {
    const r = rng(o.seed ?? 3);
    g.fillStyle = o.grout;
    g.fillRect(0, 0, w, h);
    const tw = w / o.cols;
    const th = h / o.rows;
    for (let j = 0; j < o.rows; j++)
      for (let i = -1; i <= o.cols; i++) {
        const x = i * tw + (o.brick && j % 2 ? tw / 2 : 0) + o.gap / 2;
        const y = j * th + o.gap / 2;
        g.fillStyle = o.color(r);
        g.fillRect(x, y, tw - o.gap, th - o.gap);
        const grd = g.createLinearGradient(x, y, x, y + th);
        grd.addColorStop(0, `rgba(255,255,255,${o.glaze ?? 0.25})`);
        grd.addColorStop(0.45, "rgba(255,255,255,0)");
        grd.addColorStop(1, "rgba(0,0,0,0.05)");
        g.fillStyle = grd;
        g.fillRect(x, y, tw - o.gap, th - o.gap);
      }
  });

/** Wool rug with a tonal border, painted at the rug's true proportions. */
export const rug = (wm: number, hm: number) =>
  makeCanvas(1024, (1024 * hm) / wm, (g, w, h) => {
    const r = rng(11);
    g.fillStyle = hsl(38, 24, 80);
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 60000, r, (r) => hsl(36, 20, 70 + r() * 18, 0.5), 1.2);
    const b = w * 0.045;
    g.strokeStyle = hsl(150, 18, 28, 0.85);
    g.lineWidth = b * 0.55;
    g.strokeRect(b, b, w - 2 * b, h - 2 * b);
    g.strokeStyle = hsl(38, 30, 62, 0.7);
    g.lineWidth = 3;
    g.strokeRect(b * 1.6, b * 1.6, w - 3.2 * b, h - 3.2 * b);
  });

export const fabric = (h: number, s: number, l: number, seed = 5) =>
  makeCanvas(256, 256, (g, w, hh) => {
    const r = rng(seed);
    g.fillStyle = hsl(h, s, l);
    g.fillRect(0, 0, w, hh);
    for (let y = 0; y < hh; y += 2) {
      g.fillStyle = hsl(h, s, l - 4 - r() * 4, 0.35);
      g.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = hsl(h, s, l + 3 + r() * 3, 0.25);
      g.fillRect(x, 0, 1, hh);
    }
  });

export const linen = () =>
  makeCanvas(256, 512, (g, w, h) => {
    const r = rng(19);
    g.fillStyle = hsl(40, 30, 90);
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 1.5) {
      g.fillStyle = hsl(38, 25, 82 + r() * 10, 0.35);
      g.fillRect(x, 0, 0.8, h);
    }
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = hsl(40, 20, 96, 0.2);
      g.fillRect(0, y, w, 1);
    }
  });

export const grass = () =>
  makeCanvas(512, 512, (g, w, h) => {
    const r = rng(23);
    g.fillStyle = hsl(96, 30, 38);
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 30000, r, (r) => hsl(88 + r() * 20, 35 + r() * 15, 28 + r() * 20, 0.6), 2);
  });

export const plaster = () =>
  makeCanvas(256, 256, (g, w, h) => {
    const r = rng(29);
    g.fillStyle = hsl(40, 18, 93);
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 9000, r, (r) => hsl(40, 12, 86 + r() * 12, 0.35), 1.6);
  });

export const concrete = () =>
  makeCanvas(256, 256, (g, w, h) => {
    const r = rng(31);
    g.fillStyle = hsl(36, 6, 74);
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 12000, r, (r) => hsl(36, 6, 62 + r() * 24, 0.4), 1.5);
  });

/** Dark vertical cladding boards for the entry portal. */
export const cladding = () =>
  makeCanvas(512, 512, (g, w, h) => {
    const r = rng(37);
    const n = 8;
    for (let i = 0; i < n; i++) {
      g.fillStyle = hsl(30, 10, 17 + r() * 5);
      g.fillRect((i * w) / n, 0, w / n, h);
      for (let k = 0; k < 12; k++) {
        g.fillStyle = hsl(30, 10, 22, 0.25);
        g.fillRect((i * w) / n + r() * (w / n), 0, 1, h);
      }
      g.fillStyle = "rgba(0,0,0,0.6)";
      g.fillRect(((i + 1) * w) / n - 2, 0, 2, h);
    }
  });

export const sky = () =>
  makeCanvas(4, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#7fa9cf");
    grd.addColorStop(0.55, "#c9dbe8");
    grd.addColorStop(0.75, "#f2e9dc");
    grd.addColorStop(1, "#efe3d2");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });

/** A calm abstract canvas for the lounge wall. */
export const painting = () =>
  makeCanvas(640, 400, (g, w, h) => {
    g.fillStyle = "#efe7da";
    g.fillRect(0, 0, w, h);
    blot(g, w * 0.32, h * 0.55, h * 0.55, "rgba(31,59,51,0.9)", "rgba(31,59,51,0)");
    blot(g, w * 0.68, h * 0.4, h * 0.45, "rgba(176,141,87,0.85)", "rgba(176,141,87,0)");
    blot(g, w * 0.55, h * 0.75, h * 0.3, "rgba(120,140,128,0.6)", "rgba(120,140,128,0)");
    g.strokeStyle = "rgba(30,30,30,0.5)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * 0.15, h * 0.8);
    g.bezierCurveTo(w * 0.4, h * 0.2, w * 0.6, h * 0.9, w * 0.88, h * 0.3);
    g.stroke();
  });

export const numberPlate = () =>
  makeCanvas(256, 128, (g, w, h) => {
    g.fillStyle = "#b08d57";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#1c1c1a";
    g.font = "600 76px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("0800", w / 2, h / 2 + 4);
  });

export const softDot = () =>
  makeCanvas(128, 128, (g, w) => blot(g, w / 2, w / 2, w / 2, "rgba(255,255,255,0.9)", "rgba(255,255,255,0)"));

export const sparkle = () =>
  makeCanvas(128, 128, (g, w) => {
    blot(g, w / 2, w / 2, w * 0.18, "rgba(255,255,255,1)", "rgba(255,255,255,0)");
    g.fillStyle = "rgba(255,255,255,0.95)";
    // Four-point star: one tall and one wide sliver.
    for (const [rx, ry] of [
      [0.03, 0.46],
      [0.46, 0.03],
    ]) {
      g.beginPath();
      g.ellipse(w / 2, w / 2, w * rx, w * ry, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Fades a canvas's edges to transparent over `f` pixels. */
export function feather(c: HTMLCanvasElement, f: number) {
  const g = c.getContext("2d")!;
  const { width: w, height: h } = c;
  g.globalCompositeOperation = "destination-out";
  const side = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const grd = g.createLinearGradient(x0, y0, x1, y1);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(rx, ry, rw, rh);
  };
  side(0, 0, f, 0, 0, 0, f, h);
  side(w, 0, w - f, 0, w - f, 0, f, h);
  side(0, 0, 0, f, 0, 0, w, f);
  side(0, h, 0, h - f, 0, h - f, w, f);
  g.globalCompositeOperation = "source-over";
  return c;
}

/* ─────────────────────────── Grime ───────────────────────────
 * Transparent canvases painted at each surface's real proportions
 * (pxPerM pixels per metre). The dirt layer shows them through a mask
 * that the cleaning tool erases.
 */

export function floorGrime(wm: number, hm: number) {
  const k = 1024 / wm;
  const c = makeCanvas(1024, hm * k, (g, w, h) => {
    const r = rng(41);
    for (let i = 0; i < 26; i++) blot(g, r() * w, r() * h, (0.25 + r() * 0.5) * k, `rgba(92,70,48,${0.12 + r() * 0.14})`);
    // Muddy footprints walking in from the front door (bottom edge).
    for (let s = 0; s < 9; s++) {
      const side = s % 2 ? 1 : -1;
      const x = w * 0.5 + side * 0.11 * k + (r() - 0.5) * 0.04 * k;
      const y = h - (0.25 + s * 0.36) * k;
      g.save();
      g.translate(x, y);
      g.rotate((r() - 0.5) * 0.15);
      g.fillStyle = `rgba(70,50,32,${0.55 - s * 0.04})`;
      g.beginPath();
      g.ellipse(0, -0.06 * k, 0.05 * k, 0.085 * k, 0, 0, Math.PI * 2);
      g.ellipse(0, 0.075 * k, 0.04 * k, 0.05 * k, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = `rgba(45,35,25,${0.25 + r() * 0.3})`;
      g.lineWidth = 1 + r() * 2.5;
      g.beginPath();
      const x = r() * w;
      const y = r() * h;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 0.3 * k, y + (r() - 0.5) * 0.2 * k, x + (r() - 0.5) * 0.4 * k, y + (r() - 0.5) * 0.1 * k);
      g.stroke();
    }
    speckle(g, w, h, 1800, r, (r) => `rgba(60,45,30,${0.2 + r() * 0.3})`, 1.2);
  });
  return feather(c, 0.35 * k);
}

export function tileGrime(wm: number, hm: number, grid: { cols: number; rows: number; brick: boolean }, hotspots: number[]) {
  return makeCanvas(2048, (2048 * hm) / wm, (g, w, h) => {
    const r = rng(43);
    // Grease film, heaviest around the cooktop.
    g.fillStyle = "rgba(150,110,50,0.12)";
    g.fillRect(0, 0, w, h);
    for (const f of hotspots) for (let i = 0; i < 8; i++) blot(g, w * f + (r() - 0.5) * w * 0.12, h * (0.2 + r() * 0.7), h * (0.35 + r() * 0.5), `rgba(140,95,35,${0.18 + r() * 0.15})`);
    // Dark grout lines.
    const tw = w / grid.cols;
    const th = h / grid.rows;
    g.fillStyle = "rgba(60,45,30,0.75)";
    for (let j = 0; j <= grid.rows; j++) g.fillRect(0, j * th - 2, w, 4);
    for (let j = 0; j < grid.rows; j++)
      for (let i = -1; i <= grid.cols; i++) g.fillRect(i * tw + (grid.brick && j % 2 ? tw / 2 : 0) - 2, j * th, 4, th);
    speckle(g, w, h, 1500, r, (r) => `rgba(110,70,25,${0.35 + r() * 0.4})`, 3);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = "rgba(120,90,50,0.25)";
      g.lineWidth = 2 + r() * 3;
      const x = r() * w;
      g.beginPath();
      g.moveTo(x, h * r() * 0.4);
      g.lineTo(x + (r() - 0.5) * 10, h);
      g.stroke();
    }
  });
}

export function curtainGrime(wm: number, hm: number) {
  return makeCanvas(1024, (1024 * hm) / wm, (g, w, h) => {
    const r = rng(47);
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(120,110,90,0.22)");
    grd.addColorStop(0.6, "rgba(125,105,75,0.3)");
    grd.addColorStop(1, "rgba(105,85,55,0.55)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) blot(g, r() * w, h * (0.3 + r() * 0.7), 20 + r() * 60, `rgba(100,85,60,${0.1 + r() * 0.15})`);
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = "rgba(110,85,50,0.35)";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(r() * w, h * (0.75 + r() * 0.2), 30 + r() * 30, 18 + r() * 14, 0, 0, Math.PI * 2);
      g.stroke();
    }
    speckle(g, w, h, 4000, r, (r) => `rgba(90,80,60,${0.2 + r() * 0.3})`, 1.6);
  });
}

export function carpetGrime(wm: number, hm: number) {
  return makeCanvas(1024, (1024 * hm) / wm, (g, w, h) => {
    const r = rng(53);
    g.fillStyle = "rgba(95,80,60,0.18)";
    g.fillRect(0, 0, w, h);
    // Traffic lane across the rug.
    g.save();
    g.translate(w * 0.5, h * 0.55);
    g.rotate(-0.25);
    for (let i = 0; i < 40; i++) blot(g, (r() - 0.5) * w * 1.1, (r() - 0.5) * h * 0.25, 30 + r() * 50, "rgba(80,65,45,0.16)");
    g.restore();
    blot(g, w * 0.3, h * 0.35, 48, "rgba(110,60,30,0.55)");
    blot(g, w * 0.72, h * 0.7, 36, "rgba(100,30,40,0.5)");
    g.strokeStyle = "rgba(90,55,25,0.45)";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(w * 0.6, h * 0.3, 26, 0, Math.PI * 2);
    g.stroke();
    speckle(g, w, h, 6000, r, (r) => `rgba(70,55,40,${0.25 + r() * 0.4})`, 2);
  });
}

export function sofaGrime(wm: number, hm: number, seed = 59) {
  const c = makeCanvas(1024, (1024 * hm) / wm, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "rgba(90,75,55,0.2)";
    g.fillRect(0, 0, w, h);
    for (const f of [0.18, 0.5, 0.82]) for (let i = 0; i < 6; i++) blot(g, w * f + (r() - 0.5) * w * 0.12, h * (0.3 + r() * 0.5), h * (0.25 + r() * 0.3), "rgba(80,65,45,0.22)");
    blot(g, w * 0.62, h * 0.45, h * 0.18, "rgba(110,70,35,0.5)");
    speckle(g, w, h, 1500, r, (r) => `rgba(70,55,40,${0.3 + r() * 0.4})`, 2.5);
    // Keep the seams between the three cushions clean.
    g.globalCompositeOperation = "destination-out";
    for (const f of [1 / 3, 2 / 3]) g.fillRect(w * f - 6, 0, 12, h);
    g.globalCompositeOperation = "source-over";
  });
  return feather(c, 14);
}

export function glassGrime(wm: number, hm: number) {
  return makeCanvas(1024, (1024 * hm) / wm, (g, w, h) => {
    const r = rng(61);
    g.fillStyle = "rgba(225,220,205,0.2)";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) blot(g, r() * w, h * (0.35 + r() * 0.6), 20 + r() * 50, `rgba(215,205,185,${0.12 + r() * 0.15})`);
    // Fingerprints and hand marks at hand height.
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = h * (0.45 + r() * 0.2);
      for (let k = 0; k < 4; k++) {
        g.fillStyle = "rgba(200,195,180,0.35)";
        g.beginPath();
        g.ellipse(x + k * 14, y + (k === 0 ? 18 : 0), 7, 11, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Dried rain spots.
    speckle(g, w, h, 3000, r, (r) => `rgba(235,232,222,${0.3 + r() * 0.4})`, 3);
    for (let i = 0; i < 25; i++) {
      g.strokeStyle = "rgba(220,215,200,0.3)";
      g.lineWidth = 2;
      const x = r() * w;
      const y = r() * h * 0.6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 6, y + 40 + r() * 120);
      g.stroke();
    }
  });
}

/* ─────────────────── NZ exterior: weatherboards & corrugated iron ─────────────────── */

/** Bevel-back weatherboards: 12 boards per texture (≈ 0.17 m each at 2 m per repeat). */
export const weatherboards = (bump = false) =>
  makeCanvas(512, 512, (g, w, h) => {
    const r = rng(89);
    const n = 12;
    const bh = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * bh;
      const grd = g.createLinearGradient(0, y, 0, y + bh);
      if (bump) {
        // Each board is thin at the top and thick at its lower lap.
        grd.addColorStop(0, "#3a3a3a");
        grd.addColorStop(0.92, "#ffffff");
        grd.addColorStop(1, "#000000");
      } else {
        const l = 89 + r() * 2;
        grd.addColorStop(0, hsl(200, 6, l - 4));
        grd.addColorStop(0.9, hsl(200, 6, l));
        grd.addColorStop(1, hsl(200, 8, l - 30));
      }
      g.fillStyle = grd;
      g.fillRect(0, y, w, bh);
    }
    if (!bump) speckle(g, w, h, 4000, r, (r) => hsl(200, 5, 82 + r() * 12, 0.25), 1.2);
  });

/** Corrugated roofing: 8 corrugations per texture, running down the slope. */
export const corrugated = (bump = false) =>
  makeCanvas(64, 256, (g, w, h) => {
    const n = 8;
    for (let y = 0; y < h; y++) {
      const k = 0.5 + 0.5 * Math.sin((y / h) * n * Math.PI * 2);
      const l = bump ? Math.round(k * 255) : Math.round(48 + k * 26);
      g.fillStyle = bump ? `rgb(${l},${l},${l})` : `rgb(${l - 4},${l},${l + 3})`;
      g.fillRect(0, y, w, 1);
    }
  });

/** Grime for one sofa cushion: body-soil in the middle, crumbs, maybe a spill; soft edges. */
export function cushionGrime(wm: number, hm: number, seed: number) {
  const c = makeCanvas(512, (512 * hm) / wm, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "rgba(90,75,55,0.16)";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) blot(g, w * (0.35 + r() * 0.3), h * (0.3 + r() * 0.4), Math.min(w, h) * (0.3 + r() * 0.25), "rgba(80,65,45,0.22)");
    if (r() > 0.4) blot(g, w * (0.25 + r() * 0.5), h * (0.3 + r() * 0.4), Math.min(w, h) * 0.12, "rgba(110,70,35,0.45)");
    speckle(g, w, h, 500, r, (r) => `rgba(70,55,40,${0.3 + r() * 0.4})`, 2.5);
  });
  return feather(c, Math.min(c.width, c.height) * 0.18);
}
