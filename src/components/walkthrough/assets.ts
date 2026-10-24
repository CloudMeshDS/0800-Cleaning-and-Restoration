import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Photo-scanned materials and furniture models (Poly Haven, CC0), served
 * from public/assets (see scripts/fetch-assets.js). Everything loads in the
 * background; the engine redraws as each piece arrives.
 */

/** Essential assets (textures, sky): the tour's loader waits for these. */
export const manager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(manager);
/** Furniture streams in after the reveal, so it never holds the loader up. */
const gltfLoader = new GLTFLoader(new THREE.LoadingManager());
const base = "/assets";

const cache = new Map<string, THREE.Texture>();
function tex(file: string, color: boolean) {
  let t = cache.get(file);
  if (!t) {
    t = texLoader.load(`${base}/tex/${file}`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    cache.set(file, t);
  }
  return t;
}

export type TexId = "laminate_floor_02" | "white_plaster_02" | "marble_01" | "concrete_floor_02" | "leafy_grass" | "wood_floor_deck" | "cotton_jersey";

/**
 * A physically based material from a scanned texture set.
 * `repeat` is how many times the texture tiles across the UV range.
 */
export function pbr(id: TexId, repeat: [number, number], o: { color?: THREE.ColorRepresentation; map?: boolean; normalScale?: number; roughness?: number; side?: THREE.Side } = {}) {
  const r = (t: THREE.Texture) => {
    const c = t.clone();
    c.repeat.set(repeat[0], repeat[1]);
    c.needsUpdate = true;
    return c;
  };
  const m = new THREE.MeshStandardMaterial({
    color: o.color ?? "#ffffff",
    map: o.map === false ? null : r(tex(`${id}_diff.webp`, true)),
    normalMap: r(tex(`${id}_nor.webp`, false)),
    roughnessMap: r(tex(`${id}_rough.webp`, false)),
    roughness: o.roughness ?? 1,
    side: o.side ?? THREE.FrontSide,
  });
  m.normalScale.setScalar(o.normalScale ?? 1);
  return m;
}

/** A scanned normal map only, to add real weave/texture to a painted map. */
export function normalOf(id: TexId, repeat: [number, number]) {
  const t = tex(`${id}_nor.webp`, false).clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

export type ModelId = "potted_plant_04" | "side_table_01" | "modern_arm_chair_01" | "dining_table" | "dining_chair_02";

const models = new Map<ModelId, Promise<THREE.Group>>();
function model(id: ModelId) {
  let p = models.get(id);
  if (!p) {
    p = gltfLoader.loadAsync(`${base}/models/${id}/${id}.gltf`).then((g) => {
      g.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
      });
      return g.scene;
    });
    models.set(id, p);
  }
  return p;
}

/**
 * Places a copy of a model standing on the floor at (x, y, z), scaled so it
 * is `height` metres tall (or `width` metres wide), rotated by `rot` radians.
 */
export function place(parent: THREE.Object3D, id: ModelId, at: [number, number, number], o: { height?: number; width?: number; rot?: number; onLoad?: () => void } = {}) {
  model(id)
    .then((src) => {
      const obj = src.clone(true);
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const s = o.height ? o.height / size.y : o.width ? o.width / Math.max(size.x, size.z) : 1;
      obj.scale.setScalar(s);
      const holder = new THREE.Group();
      holder.add(obj);
      const c = box.getCenter(new THREE.Vector3());
      obj.position.set(-c.x * s, -box.min.y * s, -c.z * s);
      holder.position.set(...at);
      holder.rotation.y = o.rot ?? 0;
      parent.add(holder);
      o.onLoad?.();
    })
    .catch(() => {});
}
