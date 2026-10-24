import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as T from "./textures";
import { quad, surface, type Surface } from "./dirt";
import { normalOf, pbr, place } from "./assets";

/**
 * A modern single-storey home, built from simple shapes with painted
 * textures. Front wall at z = 0, street toward +z, rooms toward −z.
 *
 *   Entry hall  x −1.2…1.2   (timber floor that gets mopped)
 *   Kitchen     left wall     (tiled splashback that gets scrubbed)
 *   Curtains    right wall    (window dressed floor to ceiling)
 *   Lounge      back          (rug, sofa, glass doors to the garden)
 */

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

export interface House {
  root: THREE.Group;
  gate: [THREE.Object3D, THREE.Object3D];
  door: THREE.Object3D;
  surfaces: Record<"floor" | "tiles" | "curtains" | "carpet" | "glass", Surface>;
  /** The flat faces of the three back cushions and three seat cushions, left to right. */
  cushions: { backs: Surface[]; seats: Surface[] };
  /** Splashback tile grid, so grime lines up with the grout. */
  tileGrid: { cols: number; rows: number; brick: boolean };
  /** Positions (0–1 across the splashback) of the cooktop and sink. */
  hotspots: number[];
}

export function buildHouse(onModel: () => void = () => {}): House {
  const root = new THREE.Group();
  const add = <O extends THREE.Object3D>(o: O, cast = true, receive = true) => {
    o.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = cast;
        c.receiveShadow = receive;
      }
    });
    root.add(o);
    return o;
  };

  /* ── materials (scanned textures; repeats assume ~2 m per tile) ── */
  const m = {
    plaster: pbr("white_plaster_02", [0.5, 0.5], { map: false, color: "#f3efe7", normalScale: 0.7 }),
    inner: pbr("white_plaster_02", [0.5, 0.5], { map: false, color: "#f5f1ea", normalScale: 0.25 }),
    ceiling: std({ color: "#f7f4ee", roughness: 1 }),
    charcoal: std({ color: "#2b2e2d", roughness: 0.6 }),
    clad: pbr("wood_floor_deck", [1, 3], { color: "#5a4a3e" }),
    timber: pbr("laminate_floor_02", [12.8 / 2, 12.3 / 2], { roughness: 0.9 }),
    oak: pbr("laminate_floor_02", [0.5, 1], { roughness: 0.8 }),
    stain: pbr("wood_floor_deck", [3, 0.12], { map: false, color: "#5e4c3e", roughness: 0.85 }),
    hedge: pbr("leafy_grass", [4, 0.6], { color: "#6f8f5a", normalScale: 1.5 }),
    weather: std({ map: T.toTexture(T.weatherboards(), [0.5, 0.5]), bumpMap: T.toTexture(T.weatherboards(true), [0.5, 0.5], false), bumpScale: 3, roughness: 0.75 }),
    iron: std({ map: T.toTexture(T.corrugated(), [1, 22]), bumpMap: T.toTexture(T.corrugated(true), [1, 22], false), bumpScale: 4, roughness: 0.45, metalness: 0.5 }),
    porchIron: std({ map: T.toTexture(T.corrugated(), [1, 3]), bumpMap: T.toTexture(T.corrugated(true), [1, 3], false), bumpScale: 4, roughness: 0.45, metalness: 0.5 }),
    trim: std({ color: "#f7f6f2", roughness: 0.55 }),
    flax: std({ color: "#4f5d33", roughness: 0.7, side: THREE.DoubleSide }),
    cabbage: std({ color: "#6f8a45", roughness: 0.75, side: THREE.DoubleSide }),
    bloom: std({ color: "#c8202a", roughness: 0.8 }),
    hedgeLong: pbr("leafy_grass", [12, 0.6], { color: "#6f8f5a", normalScale: 1.5 }),
    canopy: pbr("leafy_grass", [2, 2], { color: "#7d9c66", normalScale: 1.5 }),
    grass: pbr("leafy_grass", [70, 70], { color: "#cfe0b8" }),
    concrete: pbr("concrete_floor_02", [60, 1.6]),
    paver: pbr("concrete_floor_02", [0.4, 0.3], { color: "#e2ddd3" }),
    asphalt: std({ color: "#3a3b3d", roughness: 0.95 }),
    glass: std({ color: "#b8cdd6", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false, envMapIntensity: 1.6 }),
    forest: std({ color: "#21403a", roughness: 0.55 }),
    stone: pbr("marble_01", [1, 3], { map: false, color: "#efede8", roughness: 0.45 }),
    brass: std({ color: "#b08d57", roughness: 0.3, metalness: 1 }),
    chrome: std({ color: "#d9dde0", roughness: 0.15, metalness: 1 }),
    black: std({ color: "#121313", roughness: 0.15, metalness: 0.2 }),
    leaf: std({ color: "#55734a", roughness: 0.9 }),
    leafDark: std({ color: "#3f5a39", roughness: 0.9 }),
    trunk: std({ color: "#5d4a3a", roughness: 0.9 }),
    sofa: pbr("cotton_jersey", [6, 6], { map: false, color: "#cfc3b0", normalScale: 0.8 }),
    velvet: pbr("cotton_jersey", [4, 4], { map: false, color: "#2b4a40", normalScale: 0.8 }),
    ceramic: std({ color: "#e9e2d6", roughness: 0.35 }),
    pot: std({ color: "#c9b9a3", roughness: 0.8 }),
    lampshade: std({ color: "#f3ead9", roughness: 0.9, emissive: "#ffdca8", emissiveIntensity: 0.6 }),
    downlight: std({ color: "#fff6e6", emissive: "#fff1d6", emissiveIntensity: 1.5 }),
  };

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, y, z);
    return b;
  };
  const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
    b.position.set(x, y, z);
    return b;
  };
  const cyl = (rt: number, rb: number, h: number, mat: THREE.Material, x: number, y: number, z: number, seg = 24) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    c.position.set(x, y, z);
    return c;
  };
  const ball = (r: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
    s.position.set(x, y, z);
    return s;
  };

  /** Wall along local x (0…len) with rectangular openings [a0, a1, y0, y1]. */
  const wall = (len: number, height: number, holes: [number, number, number, number][], mat: THREE.Material) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(len, 0);
    s.lineTo(len, height);
    s.lineTo(0, height);
    s.lineTo(0, 0);
    for (const [a0, a1, y0, y1] of holes) {
      const h = new THREE.Path();
      h.moveTo(a0, y0);
      h.lineTo(a0, y1);
      h.lineTo(a1, y1);
      h.lineTo(a1, y0);
      h.lineTo(a0, y0);
      s.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false });
    g.translate(0, 0, -0.1);
    return new THREE.Mesh(g, mat);
  };

  /** Framed glazing in an opening. axis "x": spans x at depth z; "z": spans z at x. */
  const glazing = (axis: "x" | "z", a0: number, a1: number, y0: number, y1: number, at: number, mullions: number[] = []) => {
    const g = new THREE.Group();
    const span = a1 - a0;
    const mid = (a0 + a1) / 2;
    const f = 0.05;
    const place = (o: THREE.Mesh, along: number, y: number) => {
      if (axis === "x") o.position.set(along, y, at);
      else {
        o.position.set(at, y, along);
        o.rotation.y = Math.PI / 2;
      }
      g.add(o);
    };
    place(new THREE.Mesh(new THREE.BoxGeometry(span, f, 0.08), m.charcoal), mid, y0 + f / 2);
    place(new THREE.Mesh(new THREE.BoxGeometry(span, f, 0.08), m.charcoal), mid, y1 - f / 2);
    for (const a of [a0 + f / 2, a1 - f / 2, ...mullions]) place(new THREE.Mesh(new THREE.BoxGeometry(f, y1 - y0, 0.08), m.charcoal), a, (y0 + y1) / 2);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(span - f, y1 - y0 - f), m.glass);
    pane.castShadow = false;
    place(pane, mid, (y0 + y1) / 2);
    pane.rotation.y = axis === "x" ? 0 : Math.PI / 2;
    return g;
  };

  /* ── ground, street, path ── */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), m.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  add(ground, false);
  add(box(140, 0.04, 3.2, m.concrete, 0, -0.01, 12.6), false);
  add(box(140, 0.02, 9, m.asphalt, 0, -0.02, 18.8), false);
  add(box(13.4, 0.12, 13, m.concrete, 0, -0.07, -6.25), false);

  const pavers = new THREE.InstancedMesh(new RoundedBoxGeometry(0.74, 0.05, 0.54, 2, 0.01), m.paver, 30);
  let pi = 0;
  for (let z = 9.1; z > 2.3 && pi < 30; z -= 0.62)
    for (const x of [-0.39, 0.39]) {
      pavers.setMatrixAt(pi++, new THREE.Matrix4().makeTranslation(x, 0.0, z));
    }
  pavers.count = pi;
  pavers.receiveShadow = true;
  root.add(pavers);

  /* ── fence and gate ── */
  const slats = (len: number, x0: number, z: number, group: THREE.Group | THREE.Group = root as THREE.Group) => {
    for (let y = 0.16; y < 1.5; y += 0.17) group.add(box(len, 0.14, 0.04, m.stain, x0 + len / 2, y, z));
  };
  const fence = new THREE.Group();
  slats(7.75, -9, 9.5, fence);
  slats(7.75, 1.25, 9.5, fence);
  for (const x of [-9, -1.25, 1.25, 9]) {
    fence.add(box(0.42, 1.85, 0.42, m.plaster, x, 0.925, 9.5));
    fence.add(box(0.48, 0.06, 0.48, m.charcoal, x, 1.88, 9.5));
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), std({ map: T.toTexture(T.numberPlate()), roughness: 0.35, metalness: 0.6 }));
  plate.position.set(1.25, 1.35, 9.715);
  fence.add(plate);
  for (const x of [-1.25, 1.25]) fence.add(ball(0.05, m.brass, x, 1.6, 9.72));
  add(fence);

  const leaf = (pivotX: number, sign: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(pivotX, 0, 9.5);
    const inner = new THREE.Group();
    slats(1.2, 0, 0, inner);
    inner.add(box(0.05, 1.45, 0.05, m.charcoal, 0.03, 0.8, 0.03));
    inner.add(box(0.05, 1.45, 0.05, m.charcoal, 1.17, 0.8, 0.03));
    inner.add(box(0.02, 0.2, 0.03, m.brass, 1.1, 1.0, 0.06));
    inner.scale.x = sign; // right leaf mirrors toward −x
    inner.position.x = sign > 0 ? 0.02 : -0.02;
    pivot.add(inner);
    add(pivot);
    return pivot;
  };
  const gate: [THREE.Object3D, THREE.Object3D] = [leaf(-1.23, 1), leaf(1.23, -1)];

  /* ── garden ── */
  const P = (id: Parameters<typeof place>[1], at: [number, number, number], o: Parameters<typeof place>[3] = {}) => place(root, id, at, { ...o, onLoad: onModel });
  for (const sx of [-1, 1]) {
    add(rbox(6.9, 1.0, 0.7, 0.3, m.hedge, sx * 5.15, 0.5, 8.85));
    for (const dx of [-0.8, 0, 0.8]) flax(sx * 3.9 + dx, 0.9 + Math.abs(dx) * 0.2, dx === 0 ? 1.2 : 0.9);
    P("potted_plant_04", [sx * 1.08, 0, 0.62], { height: 1.25, rot: sx });
  }
  const tree = (x: number, z: number, s = 1, flowers = false) => {
    add(cyl(0.1 * s, 0.16 * s, 2.6 * s, m.trunk, x, 1.3 * s, z, 12));
    const rr = T.rng(Math.round(x * 100 + z));
    for (let i = 0; i < 9; i++) {
      const a = rr() * Math.PI * 2;
      const d = rr() * 0.9;
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((0.65 + rr() * 0.45) * s, 3), m.canopy);
      leaf.position.set(x + Math.cos(a) * d * s, (2.7 + rr() * 1.3) * s, z + Math.sin(a) * d * s);
      leaf.scale.y = 0.85;
      add(leaf);
      if (flowers) {
        // Pohutukawa: crimson blooms dotted over the canopy.
        const r0 = (leaf.geometry as THREE.IcosahedronGeometry).parameters.radius;
        const blooms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.028 * s, 0), m.bloom, 160);
        for (let k = 0; k < 160; k++) {
          const u = rr() * Math.PI * 2;
          const v = Math.acos(rr() * 1.4 - 0.4);
          blooms.setMatrixAt(k, new THREE.Matrix4().makeTranslation(leaf.position.x + Math.sin(v) * Math.cos(u) * r0, leaf.position.y + Math.cos(v) * r0 * 0.85, leaf.position.z + Math.sin(v) * Math.sin(u) * r0));
        }
        add(blooms, false);
      }
    }
  };
  /** Harakeke (NZ flax): a fan of long sword leaves. */
  function flax(x: number, z: number, h: number) {
    const rr = T.rng(Math.round(Math.abs(x * 97 + z * 31)) + 1);
    const g = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const len = h * (0.6 + rr() * 0.5);
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.07, len), m.flax);
      blade.geometry.translate(0, len / 2, 0);
      const pivot = new THREE.Group();
      pivot.rotation.set(0, rr() * Math.PI * 2, 0);
      blade.rotation.set(0.15 + rr() * 0.45, 0, (rr() - 0.5) * 0.2);
      pivot.add(blade);
      g.add(pivot);
    }
    g.position.set(x, 0, z);
    add(g);
  }
  /** Ti kouka (cabbage tree): slim trunk forking into spiky leaf tufts. */
  const cabbageTree = (x: number, z: number) => {
    add(cyl(0.09, 0.14, 2.6, m.trunk, x, 1.3, z, 10));
    for (const [dx, dz, h] of [
      [-0.45, 0.1, 3.3],
      [0.4, -0.2, 3.6],
      [0.05, 0.35, 3.1],
    ]) {
      const tip = new THREE.Vector3(x + dx, h, z + dz);
      const base = new THREE.Vector3(x, 2.5, z);
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, tip.distanceTo(base), 8), m.trunk);
      br.position.copy(base).add(tip).multiplyScalar(0.5);
      br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(base).normalize());
      add(br);
      const rr = T.rng(Math.round(h * 100));
      const tuft = new THREE.Group();
      for (let i = 0; i < 40; i++) {
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.75), m.cabbage);
        blade.geometry.translate(0, 0.37, 0);
        const pivot = new THREE.Group();
        pivot.rotation.y = rr() * Math.PI * 2;
        blade.rotation.x = 0.2 + rr() * 2.1; // upright to drooping
        pivot.add(blade);
        tuft.add(pivot);
      }
      tuft.position.copy(tip);
      add(tuft, false);
    }
  };
  tree(-7.6, 5.2, 1.15, true);
  cabbageTree(7.3, 6.3);
  tree(6.8, -18.5, 1.2);
  tree(-4.8, -19.5, 1.05);
  add(rbox(22, 1.1, 0.9, 0.35, m.hedgeLong, 0, 0.55, -19));
  add(box(6, 0.1, 3, m.oak, 3.4, -0.02, -14.1), false);

  /* ── shell: walls, roof, ceiling, floor ── */
  const front = wall(13, 3, [[5.9, 7.1, 0, 2.5], [1.1, 4.1, 1.0, 2.4], [8.7, 11.9, 0.5, 2.5]], m.plaster);
  front.position.set(-6.5, 0, 0);
  add(front);
  add(glazing("x", -5.4, -2.4, 1.0, 2.4, 0, [-3.9]));
  add(glazing("x", 2.2, 5.4, 0.5, 2.5, 0, [3.8]));

  const back = wall(13, 3, [[7.5, 12.3, 0, 2.7]], m.inner);
  back.position.set(-6.5, 0, -12.5);
  add(back);
  const backGlass = glazing("x", 1.0, 5.8, 0, 2.7, -12.5);
  add(backGlass);
  add(box(0.05, 2.7, 0.06, m.charcoal, 3.4, 1.35, -12.47));

  for (const x of [-6.5, 6.5]) {
    const w = wall(12.5, 3, x > 0 ? [[1.4, 4.8, 0.25, 2.65]] : [], m.plaster);
    w.rotation.y = Math.PI / 2;
    w.position.set(x, 0, 0);
    add(w);
  }
  add(glazing("z", -4.8, -1.4, 0.25, 2.65, 6.5));

  /* ── NZ exterior: weatherboards and a gable roof in corrugated iron ── */
  const pitch = (25 * Math.PI) / 180;
  const ridge = 3 + 6.5 * Math.tan(pitch);
  const midY = (3 - 0.6 * Math.tan(pitch) + ridge) / 2;
  /** Weatherboard skin just outside a wall: outline and openings in the wall's local frame. */
  const clad = (pts: [number, number][], holes: [number, number, number, number][], z0: number) => {
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const [a0, a1, y0, y1] of holes) sh.holes.push(new THREE.Path([new THREE.Vector2(a0, y0), new THREE.Vector2(a0, y1), new THREE.Vector2(a1, y1), new THREE.Vector2(a1, y0)]));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false });
    g.translate(0, 0, z0);
    return new THREE.Mesh(g, m.weather);
  };
  const gableEnd: [number, number][] = [[0, 0], [13, 0], [13, 3], [6.5, ridge], [0, 3]];
  const fc = clad(gableEnd, [[5.9, 7.1, 0, 2.5], [1.1, 4.1, 1.0, 2.4], [8.7, 11.9, 0.5, 2.5]], 0.1);
  fc.position.set(-6.5, 0, 0);
  add(fc);
  const bc = clad(gableEnd, [[7.5, 12.3, 0, 2.7]], -0.13);
  bc.position.set(-6.5, 0, -12.5);
  add(bc);
  for (const x of [-6.5, 6.5]) {
    const sc = clad([[0, 0], [12.5, 0], [12.5, 3], [0, 3]], x > 0 ? [[1.4, 4.8, 0.25, 2.65]] : [], x > 0 ? 0.1 : -0.13);
    sc.rotation.y = Math.PI / 2;
    sc.position.set(x, 0, 0);
    add(sc);
  }
  // White facings around windows and the front door.
  const facing = (x0: number, x1: number, y0: number, y1: number, z: number, sill = true) => {
    add(box(x1 - x0 + 0.24, 0.1, 0.05, m.trim, (x0 + x1) / 2, y1 + 0.05, z));
    for (const x of [x0 - 0.06, x1 + 0.06]) add(box(0.12, y1 - y0, 0.05, m.trim, x, (y0 + y1) / 2, z));
    if (sill) add(box(x1 - x0 + 0.3, 0.05, 0.12, m.trim, (x0 + x1) / 2, y0 - 0.02, z + 0.04));
  };
  facing(-5.4, -2.4, 1.0, 2.4, 0.15);
  facing(2.2, 5.4, 0.5, 2.5, 0.15);
  facing(-0.6, 0.6, 0, 2.5, 0.15, false);
  const sideFacing = new THREE.Group();
  sideFacing.add(box(0.05, 0.1, 3.64, m.trim, 0, 2.7, 0), box(0.05, 2.4, 0.12, m.trim, 0, 1.45, -1.76), box(0.05, 2.4, 0.12, m.trim, 0, 1.45, 1.76), box(0.12, 0.05, 3.7, m.trim, 0.04, 0.23, 0));
  sideFacing.position.set(6.65, 0, -3.1);
  add(sideFacing);
  // Roof planes, ridge cap, barge boards, fascia, spouting and downpipes.
  const run = 7.1 / Math.cos(pitch);
  for (const sx of [-1, 1]) {
    const plane = box(run, 0.05, 13.5, m.iron, sx * 3.55, midY, -6.25);
    plane.rotation.z = -sx * pitch;
    add(plane);
    for (const z of [0.52, -13.02]) {
      const bb = box(run, 0.22, 0.04, m.trim, sx * 3.55, midY - 0.08, z);
      bb.rotation.z = -sx * pitch;
      add(bb);
    }
    add(box(0.04, 0.2, 13.5, m.trim, sx * 7.12, 2.6, -6.25));
    add(box(0.12, 0.1, 13.5, m.charcoal, sx * 7.19, 2.58, -6.25));
    for (const z of [0.35, -12.85]) add(cyl(0.04, 0.04, 2.55, m.charcoal, sx * 7.2, 1.28, z, 10));
  }
  add(box(0.3, 0.06, 13.5, m.charcoal, 0, ridge + 0.03, -6.25));
  add(box(0.6, 0.4, 0.05, m.trim, 0, ridge - 1.2, 0.16));
  for (let y = -0.12; y <= 0.12; y += 0.08) add(box(0.5, 0.03, 0.03, m.charcoal, 0, ridge - 1.2 + y, 0.19));

  // Covered front porch (veranda) over a timber deck.
  const porch = box(3.6, 0.04, 2.2, m.porchIron, 0, 2.78, 1.15);
  porch.rotation.x = 0.06;
  add(porch);
  add(box(3.64, 0.18, 0.05, m.trim, 0, 2.66, 2.26));
  for (const x of [-1.6, 1.6]) add(box(0.12, 2.68, 0.12, m.trim, x, 1.34, 2.15));
  add(box(3.6, 0.08, 2.2, m.oak, 0, -0.03, 1.15), false);
  // Letterbox by the gate.
  add(box(0.08, 1.0, 0.08, m.stain, 2.05, 0.5, 9.95));
  add(rbox(0.36, 0.26, 0.45, 0.03, m.charcoal, 2.05, 1.1, 9.95));
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 12.3), m.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 2.995, -6.25);
  add(ceiling, false);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 12.3), m.timber);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.003, -6.25);
  add(floor, false);
  for (const [x, z] of [
    [0, -1.5],
    [0, -3.5],
    [-4.2, -2],
    [-4.2, -4],
    [3.6, -2],
    [3.6, -4],
    [-1.6, -8.5],
    [-1.6, -10.8],
    [3.4, -9.5],
    [-4.3, -7],
  ]) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), m.downlight);
    d.rotation.x = Math.PI / 2;
    d.position.set(x, 2.99, z);
    root.add(d);
  }

  /* ── entry portal and front door ── */
  for (const x of [-0.9, 0.9]) add(cyl(0.035, 0.035, 0.18, std({ color: "#b08d57", emissive: "#ffd79a", emissiveIntensity: 1.2, metalness: 1, roughness: 0.3 }), x, 2.05, 0.2, 16));
  const door = new THREE.Group();
  door.position.set(-0.6, 0, 0.02);
  const leafMesh = box(1.2, 2.5, 0.06, m.oak, 0.6, 1.25, 0);
  door.add(leafMesh);
  door.add(box(0.025, 1.0, 0.04, m.brass, 1.05, 1.2, 0.06));
  add(door);

  /* ── hall dressing ── */
  add(rbox(1.2, 0.45, 0.4, 0.04, m.oak, -2.2, 0.225, -0.5));
  P("potted_plant_04", [2.0, 0, -0.6], { height: 1.3, rot: 0.7 });

  /* ── kitchen ── */
  add(box(0.6, 0.88, 4.4, m.forest, -6.1, 0.44, -3.0));
  for (let z = -1.1; z > -5.1; z -= 0.6) add(box(0.02, 0.22, 0.02, m.brass, -5.79, 0.72, z));
  add(box(0.64, 0.04, 4.44, m.stone, -6.08, 0.9, -3.0));
  add(box(0.5, 0.008, 0.56, m.black, -6.1, 0.925, -3.9));
  add(box(0.42, 0.01, 0.5, m.black, -6.1, 0.922, -1.7));
  const tap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 10, 24, Math.PI), m.chrome);
  tap.position.set(-6.32, 1.04, -1.7);
  tap.rotation.y = Math.PI / 2;
  add(tap);
  add(cyl(0.014, 0.014, 0.12, m.chrome, -6.32, 0.98, -1.58, 10));
  add(box(0.62, 2.6, 1.0, m.forest, -6.1, 1.3, -5.75));
  add(box(0.28, 0.04, 1.8, m.oak, -6.25, 2.0, -2.2));
  for (const [z, h, r] of [
    [-1.6, 0.18, 0.06],
    [-1.8, 0.24, 0.05],
    [-2.6, 0.12, 0.11],
    [-2.95, 0.2, 0.07],
  ])
    add(cyl(r * 0.9, r, h, m.ceramic, -6.25, 2.02 + h / 2, z, 20));

  const tileGrid = { cols: 29, rows: 8, brick: true };
  const tilesSurf = surface([-6.392, 0.94, -0.8], [0, 0, -4.4], [0, 0.64, 0]);
  const tileTex = T.toTexture(
    T.tiles({ w: 2048, h: (2048 * 0.64) / 4.4, cols: tileGrid.cols, rows: tileGrid.rows, gap: 4, brick: true, grout: "#d9d4ca", color: (r) => `hsl(40, 20%, ${93 + r() * 4}%)`, glaze: 0.35 }),
  );
  add(new THREE.Mesh(quad(tilesSurf), std({ map: tileTex, roughness: 0.18 })), false);

  // Dining between kitchen and lounge.
  P("dining_table", [-4.3, 0, -7.0], { width: 2.0 });
  for (const [x, z, rot] of [
    [-4.85, -6.35, Math.PI],
    [-3.75, -6.35, Math.PI],
    [-4.85, -7.65, 0],
    [-3.75, -7.65, 0],
  ])
    P("dining_chair_02", [x, 0, z], { height: 0.85, rot });
  add(cyl(0.005, 0.005, 0.85, m.charcoal, -4.3, 2.57, -7.0, 6));
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m.brass);
  pendant.position.set(-4.3, 2.1, -7.0);
  add(pendant, false);

  /* ── curtain room ── */
  const curtainBump = (x: number) => 0.045 * (0.5 + 0.5 * Math.sin(x * Math.PI * 2 * 23));
  const curtainsSurf = surface([6.28, 0.04, -4.95], [0, 0, 3.7], [0, 2.72, 0], curtainBump);
  const curtain = new THREE.Mesh(
    quad(curtainsSurf, 0, 240),
    std({ map: T.toTexture(T.linen(), [3, 1]), normalMap: normalOf("cotton_jersey", [14, 10]), roughness: 0.95, side: THREE.DoubleSide, emissive: "#3b3022", emissiveIntensity: 0.3 }),
  );
  add(curtain, true, true);
  const rodM = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 4.1, 12), m.brass);
  rodM.rotation.x = Math.PI / 2;
  rodM.position.set(6.3, 2.8, -3.1);
  add(rodM);
  for (const z of [-5.15, -1.05]) add(ball(0.035, m.brass, 6.3, 2.8, z));
  // Armchair, side table, lamp, plant.
  P("modern_arm_chair_01", [5.2, 0, -6.3], { width: 0.85, rot: -Math.PI / 2 - 0.5 });
  P("side_table_01", [4.3, 0, -6.6], { height: 0.55 });
  add(cyl(0.012, 0.012, 1.45, m.brass, 6.0, 0.725, -5.7, 8));
  add(cyl(0.16, 0.22, 0.28, m.lampshade, 6.0, 1.55, -5.7), false);
  P("potted_plant_04", [5.7, 0, -0.7], { height: 1.4, rot: 1 });

  /* ── lounge ── */
  const carpetSurf = surface([-3.4, 0.016, -8.8], [3.6, 0, 0], [0, 0, -2.4]);
  add(box(3.6, 0.012, 2.4, std({ color: "#cfc4b2", roughness: 1 }), -1.6, 0.007, -10.0), false);
  add(new THREE.Mesh(quad(carpetSurf), std({ map: T.toTexture(T.rug(3.6, 2.4)), roughness: 1 })), false);

  add(rbox(2.8, 0.28, 0.95, 0.04, m.sofa, -1.6, 0.22, -11.85));
  for (const s of [-1, 1]) add(rbox(0.2, 0.62, 0.95, 0.06, m.sofa, -1.6 + s * 1.3, 0.39, -11.85));
  add(rbox(2.8, 0.52, 0.22, 0.06, m.sofa, -1.6, 0.62, -12.2));
  for (const dx of [-0.83, 0, 0.83]) {
    add(rbox(0.81, 0.14, 0.62, 0.05, m.sofa, -1.6 + dx, 0.43, -11.6));
    add(rbox(0.81, 0.42, 0.17, 0.06, m.sofa, -1.6 + dx, 0.72, -11.98));
  }
  for (const x of [-2.9, -0.3]) add(box(0.04, 0.08, 0.04, m.charcoal, x, 0.04, -11.45));
  // Inset from each cushion's rounded edges so the grime sits on the cushion itself.
  const cushionX = [-0.83, 0, 0.83].map((dx) => -1.6 + dx);
  const seats = cushionX.map((cx) => surface([cx - 0.35, 0.503, -11.36], [0.7, 0, 0], [0, 0, -0.5]));
  const backs = cushionX.map((cx) => surface([cx - 0.34, 0.58, -11.893], [0.68, 0, 0], [0, 0.28, 0]));

  P("side_table_01", [-3.55, 0, -11.9], { height: 0.55 });
  add(cyl(0.09, 0.13, 0.32, m.ceramic, -3.55, 0.73, -11.9));
  add(cyl(0.17, 0.2, 0.22, m.lampshade, -3.55, 1.0, -11.9), false);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), std({ map: T.toTexture(T.painting()), roughness: 0.85 }));
  art.position.set(-1.6, 1.78, -12.365);
  add(art, false);
  add(box(1.78, 1.13, 0.03, m.oak, -1.6, 1.78, -12.39), false);
  P("potted_plant_04", [0.5, 0, -11.95], { height: 1.7, rot: 2 });
  const glassSurf = surface([1.08, 0.05, -12.33], [4.64, 0, 0], [0, 2.58, 0]);

  return {
    root,
    gate,
    door,
    surfaces: { floor: surface([-1.2, 0.004, -1.2], [2.4, 0, 0], [0, 0, -3.2]), tiles: tilesSurf, curtains: curtainsSurf, carpet: carpetSurf, glass: glassSurf },
    cushions: { backs, seats },
    tileGrid,
    hotspots: [(3.9 - 0.8) / 4.4, (1.7 - 0.8) / 4.4],
  };
}
