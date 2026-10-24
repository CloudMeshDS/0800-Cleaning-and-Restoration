// node scripts/fetch-assets.js — downloads the walkthrough's CC0 assets from
// Poly Haven (polyhaven.com) into public/assets and compresses them.
// Re-run to refresh; existing files are overwritten.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

sharp.cache(false);
const OUT = path.join(__dirname, "..", "public", "assets");
const api = async (id) => (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
const get = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer());

const TEXTURES = ["laminate_floor_02", "white_plaster_02", "marble_01", "concrete_floor_02", "leafy_grass", "wood_floor_deck", "cotton_jersey"];
const MODELS = ["potted_plant_04", "side_table_01", "modern_arm_chair_01", "dining_table", "dining_chair_02"];
const SKY = "kloofendal_48d_partly_cloudy_puresky";

/** Minimal Radiance .hdr (RGBE, RLE) decoder → Float32 RGB. */
function decodeHDR(buf) {
  let p = 0;
  const line = () => {
    let s = "";
    while (buf[p] !== 10) s += String.fromCharCode(buf[p++]);
    p++;
    return s;
  };
  let l;
  while ((l = line()) !== "");
  const [, h, , w] = line().split(" ").map((x) => (isNaN(+x) ? x : +x));
  const out = new Float32Array(w * h * 3);
  const scan = new Uint8Array(w * 4);
  for (let y = 0; y < h; y++) {
    p += 4; // new-style RLE header
    for (let c = 0; c < 4; c++) {
      let x = 0;
      while (x < w) {
        let n = buf[p++];
        if (n > 128) {
          n -= 128;
          const v = buf[p++];
          while (n--) scan[c * w + x++] = v;
        } else while (n--) scan[c * w + x++] = buf[p++];
      }
    }
    for (let x = 0; x < w; x++) {
      const e = scan[3 * w + x];
      const f = e ? Math.pow(2, e - 136) : 0;
      const o = (y * w + x) * 3;
      out[o] = scan[x] * f;
      out[o + 1] = scan[w + x] * f;
      out[o + 2] = scan[2 * w + x] * f;
    }
  }
  return { w, h, data: out };
}

(async () => {
  fs.mkdirSync(path.join(OUT, "tex"), { recursive: true });
  for (const id of TEXTURES) {
    const f = await api(id);
    for (const [key, name, q] of [
      ["Diffuse", "diff", 80],
      ["nor_gl", "nor", 88],
      ["Rough", "rough", 75],
    ]) {
      const url = f[key]?.["1k"]?.jpg?.url;
      if (!url) continue;
      // Detail maps are small in view: 512 px. Only the floor colour map keeps 1024 px.
      const size = id === "laminate_floor_02" && name === "diff" ? 1024 : 512;
      const out = await sharp(await get(url)).resize(size, size, { fit: "inside" }).webp({ quality: name === "nor" ? 80 : name === "rough" ? 65 : 72, effort: 6 }).toBuffer();
      fs.writeFileSync(path.join(OUT, "tex", `${id}_${name}.webp`), out);
    }
    console.log("texture", id);
  }

  fs.mkdirSync(path.join(OUT, "sky"), { recursive: true });
  const sky = await api(SKY);
  // Backdrop: tone-map the 2k HDR into a light JPEG.
  const hdr = decodeHDR(await get(sky.hdri["2k"].hdr.url));
  const px = Buffer.alloc(hdr.w * hdr.h * 3);
  for (let i = 0; i < hdr.data.length; i++) {
    const v = hdr.data[i] * 1.1;
    const t = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14); // ACES
    px[i] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, t)), 1 / 2.2));
  }
  fs.writeFileSync(path.join(OUT, "sky", "backdrop.jpg"), await sharp(px, { raw: { width: hdr.w, height: hdr.h, channels: 3 } }).jpeg({ quality: 82 }).toBuffer());
  console.log("sky");

  for (const id of MODELS) {
    const dir = path.join(OUT, "models", id);
    fs.mkdirSync(dir, { recursive: true });
    const g = (await api(id)).gltf["1k"].gltf;
    fs.writeFileSync(path.join(dir, `${id}.gltf`), await get(g.url));
    for (const [rel, v] of Object.entries(g.include || {})) {
      const file = path.join(dir, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      let buf = await get(v.url);
      if (/\.(jpe?g|png)$/i.test(rel)) buf = await sharp(buf).resize(256, 256, { fit: "inside" }).toBuffer();
      fs.writeFileSync(file, buf);
    }
    console.log("model", id);
  }
})();
