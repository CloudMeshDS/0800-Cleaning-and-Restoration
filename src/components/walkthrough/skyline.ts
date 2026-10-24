import * as THREE from "three";
import { rng } from "./textures";

/**
 * Auckland's Sky Tower (328 m) and a hazy city skyline around it, about
 * 1.6 km away behind the house. It shows above the roof from the street and
 * through the lounge's glass doors. Atmospheric fog does the distance.
 */
export function buildSkyline(at = new THREE.Vector3(-540, 0, -1500)) {
  const g = new THREE.Group();
  g.position.copy(at);
  const concrete = new THREE.MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.8 });
  const grey = new THREE.MeshStandardMaterial({ color: "#a7aaac", roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: "#3f5664", roughness: 0.15, metalness: 0.6 });
  const white = new THREE.MeshStandardMaterial({ color: "#f1f0ec", roughness: 0.5 });
  const steel = new THREE.MeshStandardMaterial({ color: "#c4c8cb", roughness: 0.35, metalness: 0.8 });

  /** A cylinder between heights y0 and y1, radius r0 at the bottom and r1 at the top. */
  const ring = (y0: number, y1: number, r0: number, r1: number, m: THREE.Material, seg = 32) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, y1 - y0, seg), m);
    c.position.y = (y0 + y1) / 2;
    g.add(c);
  };

  // Eight splayed legs, then the slender shaft.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 52, 2.2), concrete);
    leg.position.set(Math.cos(a) * 8.5, 25, Math.sin(a) * 8.5);
    leg.rotation.set(Math.sin(a) * 0.09, 0, -Math.cos(a) * 0.09);
    g.add(leg);
  }
  ring(0, 182, 6.5, 6, concrete);
  // The pod: restaurant and observation levels.
  ring(182, 187, 7, 13, grey);
  ring(187, 196, 17, 18, glass, 48);
  ring(196, 199, 19, 19, white, 48);
  ring(199, 208, 16, 15, glass, 48);
  ring(208, 211, 15.5, 13, white, 48);
  ring(211, 216, 12, 11, glass, 48);
  ring(216, 219, 9, 9, white);
  ring(219, 224, 8, 7.5, glass);
  // Mast and beacon.
  ring(224, 290, 3.2, 1.6, steel, 16);
  ring(250, 254, 4, 4, white, 16);
  ring(290, 326, 1.2, 0.35, steel, 12);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), new THREE.MeshStandardMaterial({ color: "#ff4b3e", emissive: "#ff3020", emissiveIntensity: 2 }));
  beacon.position.y = 327;
  g.add(beacon);

  // City around it: towers of varied height, kept below the Sky Tower's pod.
  const r = rng(83);
  const city = new THREE.Group();
  const shades = ["#b9c0c6", "#a8b2ba", "#c9cdd0", "#9aa6ae", "#d4d6d6"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.15 }));
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 1100;
    const z = (r() - 0.5) * 500;
    if (Math.hypot(x, z) < 30) continue;
    const near = 1 - Math.min(1, Math.hypot(x, z * 1.5) / 600);
    const h = 18 + r() * 40 + near * near * (60 + r() * 110);
    const w = 18 + r() * 30;
    const d = 18 + r() * 30;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shades[i % shades.length]);
    b.position.set(x, h / 2, z);
    b.rotation.y = r() * 0.4;
    city.add(b);
  }
  g.add(city);
  return g;
}
