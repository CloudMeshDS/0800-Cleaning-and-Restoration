/**
 * Organic noise as an inline SVG data URI (feTurbulence), rendered once by the
 * browser and tiled – realistic grime/fibre texture with no image download.
 */
export function noise({ freq = 0.8, octaves = 3, alpha = 0.5, rgb = "60 50 35", size = 220, seed = 2 } = {}) {
  const [r, g, b] = rgb.split(" ").map((n) => (Number(n) / 255).toFixed(3));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${alpha * 2.2} 0 0 0 ${-alpha * 0.6}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${svg.replace(/"/g, "'").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
}
