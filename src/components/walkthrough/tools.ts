import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Professional cleaning tools, modelled in their own frame:
 * the contact point is the origin, local +Y points away from the surface
 * being cleaned, and local +Z points toward the (unseen) operator, so the
 * handle always leads out of frame like someone is holding it.
 */

const mat = (color: string, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

const M = {
  alu: mat("#c7ccd0", 0.28, 1),
  forest: mat("#1f3b33", 0.45),
  brass: mat("#b08d57", 0.32, 1),
  charcoal: mat("#2a2d2c", 0.55),
  rubber: mat("#151515", 0.85),
  white: mat("#f2f0eb", 0.35),
  micro: mat("#8aa3ae", 1),
  bristle: mat("#e6dbc2", 0.9),
  clear: new THREE.MeshStandardMaterial({ color: "#9fc4d6", roughness: 0.1, transparent: true, opacity: 0.55 }),
};

function rbox(w: number, h: number, d: number, r: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** A cylinder from a to b. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) {
  const dir = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 16), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/** Pole from `start` along direction `dir` with a forest-green grip near the end. */
function pole(g: THREE.Group, start: THREE.Vector3, dir: THREE.Vector3, len: number, r = 0.013) {
  const d = dir.clone().normalize();
  const end = start.clone().addScaledVector(d, len);
  g.add(rod(start, end, r, M.alu));
  g.add(rod(start.clone().addScaledVector(d, len * 0.68), start.clone().addScaledVector(d, len * 0.86), r * 1.35, M.forest));
  return end;
}

export type ToolKind = "mop" | "brush" | "steamer" | "vacuum" | "upholstery" | "squeegee";

/** Marks where a hose attaches (tool end or machine outlet). */
function port(g: THREE.Object3D, at: THREE.Vector3) {
  const p = new THREE.Object3D();
  p.name = "port";
  p.position.copy(at);
  g.add(p);
}

function wheel(g: THREE.Object3D, r: number, x: number, y: number, z: number) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 20), M.rubber);
  w.rotation.z = Math.PI / 2;
  w.position.set(x, y, z);
  g.add(w);
}

export function makeTool(kind: ToolKind): THREE.Group {
  const g = new THREE.Group();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  switch (kind) {
    case "mop": {
      g.add(rbox(0.46, 0.04, 0.14, 0.018, M.micro, 0, 0.02, 0));
      g.add(rbox(0.42, 0.022, 0.11, 0.008, M.forest, 0, 0.05, 0));
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), M.brass);
      j.position.set(0, 0.068, 0);
      g.add(j);
      pole(g, v(0, 0.07, 0), v(0, 0.74, 0.67), 1.5);
      break;
    }
    case "vacuum": {
      // Upright vacuum: brush-roll head, rear wheels, then the body leaning back to the handle.
      g.add(rbox(0.36, 0.07, 0.24, 0.025, M.charcoal, 0, 0.045, 0.02));
      g.add(rbox(0.34, 0.02, 0.025, 0.008, M.forest, 0, 0.03, -0.1));
      g.add(rbox(0.26, 0.015, 0.07, 0.006, M.clear, 0, 0.085, -0.04));
      for (const x of [-0.17, 0.17]) wheel(g, 0.045, x, 0.045, 0.12);
      const body = new THREE.Group();
      body.position.set(0, 0.09, 0.12);
      body.rotation.x = 0.55;
      body.add(rbox(0.22, 0.26, 0.17, 0.05, M.forest, 0, 0.18, 0));
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.3, 24), M.clear);
      can.position.y = 0.46;
      body.add(can);
      const dust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 20), mat("#8d867a", 1));
      dust.position.y = 0.36;
      body.add(dust);
      body.add(rbox(0.18, 0.05, 0.15, 0.02, M.charcoal, 0, 0.635, 0));
      body.add(rbox(0.19, 0.012, 0.16, 0.005, M.brass, 0, 0.31, 0));
      body.add(rod(v(0, 0.66, 0), v(0, 1.05, 0), 0.016, M.alu));
      body.add(rbox(0.05, 0.15, 0.045, 0.02, M.charcoal, 0, 1.11, 0));
      g.add(body);
      break;
    }
    case "brush": {
      g.add(rbox(0.16, 0.03, 0.075, 0.01, M.bristle, 0, 0.015, 0));
      g.add(rbox(0.17, 0.045, 0.085, 0.015, M.forest, 0, 0.05, 0));
      g.add(rbox(0.05, 0.012, 0.05, 0.004, M.brass, 0, 0.078, 0));
      pole(g, v(0, 0.075, 0), v(0, 0.85, 0.53), 1.5);
      break;
    }
    case "steamer": {
      g.add(rbox(0.26, 0.012, 0.06, 0.005, M.brass, 0, 0.006, 0));
      g.add(rbox(0.27, 0.06, 0.07, 0.022, M.white, 0, 0.042, 0));
      g.add(rbox(0.06, 0.03, 0.04, 0.01, M.forest, 0, 0.08, 0.01));
      const end = pole(g, v(0, 0.08, 0.02), v(0, 0.25, 0.97), 0.32, 0.018);
      port(g, end);
      break;
    }
    case "upholstery": {
      g.add(rbox(0.2, 0.035, 0.06, 0.012, M.charcoal, 0, 0.018, 0));
      g.add(rbox(0.15, 0.018, 0.025, 0.006, M.clear, 0, 0.04, 0.012));
      const end = pole(g, v(0, 0.035, 0.02), v(0, 0.55, 0.83), 0.5, 0.016);
      port(g, end);
      break;
    }
    case "squeegee": {
      g.add(rbox(0.42, 0.016, 0.02, 0.006, M.rubber, 0, 0.008, 0));
      g.add(rbox(0.44, 0.03, 0.03, 0.008, M.alu, 0, 0.03, 0));
      const t = pole(g, v(0, 0.045, 0), v(0, 0.3, 0.95), 0.3, 0.016);
      g.add(rod(t, t.clone().addScaledVector(v(0, 0.3, 0.95).normalize(), 1.0), 0.013, M.forest));
      break;
    }
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = false;
  });
  return g;
}

/** Orients a tool so its +Y is `normal` and its +Z leans toward `operator`. */
export function poseTool(tool: THREE.Object3D, at: THREE.Vector3, normal: THREE.Vector3, operator: THREE.Vector3, yaw = 0) {
  const y = normal.clone().normalize();
  const z = operator.clone().addScaledVector(y, -operator.dot(y)).normalize();
  const x = y.clone().cross(z).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  tool.quaternion.setFromRotationMatrix(m);
  if (yaw) tool.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
  tool.position.copy(at);
}

export type UnitKind = "steamer" | "extractor";

/** The machine a hosed tool runs from, standing on the floor. */
export function makeUnit(kind: UnitKind): THREE.Group {
  const g = new THREE.Group();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  if (kind === "steamer") {
    g.add(rbox(0.36, 0.08, 0.36, 0.03, M.charcoal, 0, 0.06, 0));
    for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) wheel(g, 0.025, x, 0.025, z);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.32, 28), M.white);
    tank.position.y = 0.26;
    g.add(tank);
    g.add(rbox(0.31, 0.03, 0.31, 0.01, M.forest, 0, 0.26, 0));
    g.add(rbox(0.3, 0.08, 0.3, 0.03, M.white, 0, 0.46, 0));
    g.add(rod(v(0, 0.5, -0.08), v(0, 1.55, -0.08), 0.012, M.alu));
    g.add(rod(v(-0.2, 1.55, -0.08), v(0.2, 1.55, -0.08), 0.01, M.alu));
    port(g, v(0, 0.47, 0.15));
  } else {
    g.add(rbox(0.42, 0.42, 0.32, 0.05, M.charcoal, 0, 0.27, 0));
    g.add(rbox(0.32, 0.16, 0.26, 0.04, M.clear, 0, 0.56, 0));
    g.add(rbox(0.43, 0.04, 0.33, 0.01, M.forest, 0, 0.12, 0));
    g.add(rod(v(-0.16, 0.64, 0.12), v(-0.16, 0.95, 0.12), 0.012, M.alu));
    g.add(rod(v(0.16, 0.64, 0.12), v(0.16, 0.95, 0.12), 0.012, M.alu));
    g.add(rod(v(-0.17, 0.95, 0.12), v(0.17, 0.95, 0.12), 0.014, M.rubber));
    for (const x of [-0.18, 0.18]) wheel(g, 0.06, x, 0.06, 0.13);
    port(g, v(0, 0.3, -0.17));
  }
  return g;
}

/** A flexible hose between two points, re-drawn as they move, sagging under its weight. */
export class Hose {
  readonly mesh = new THREE.Mesh(new THREE.BufferGeometry(), M.charcoal);
  private readonly mid = new THREE.Vector3();
  update(a: THREE.Vector3, b: THREE.Vector3) {
    const len = a.distanceTo(b);
    this.mid.copy(a).add(b).multiplyScalar(0.5);
    this.mid.y = Math.max(0.03, Math.min(a.y, b.y) - len * 0.25);
    const curve = new THREE.CatmullRomCurve3([a.clone(), a.clone().lerp(this.mid, 0.5).setY((a.y + this.mid.y) / 2 - 0.05), this.mid.clone(), b.clone().lerp(this.mid, 0.5), b.clone()]);
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.TubeGeometry(curve, 36, 0.017, 8);
  }
}
