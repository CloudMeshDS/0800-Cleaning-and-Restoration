import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { manager } from "./assets";
import { buildSkyline } from "./skyline";
import { buildHouse } from "./house";
import { Dirt, pointOn, strokes, type Surface } from "./dirt";
import { Hose, makeTool, makeUnit, poseTool, type ToolKind, type UnitKind } from "./tools";
import * as T from "./textures";
import { DOOR, GATE, MOVES, TASKS, type TaskKey } from "./timeline";

/**
 * The 3D walkthrough. Everything is a pure function of scroll progress
 * (0–1): set it and the scene is drawn once, so scrubbing backwards works
 * and nothing renders while the page is still.
 */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

interface Layer {
  dirt: Dirt;
  share: number;
}

interface Job {
  range: readonly [number, number];
  layers: Layer[];
  tool: THREE.Group;
  operator: (s: Surface) => THREE.Vector3;
  steam?: THREE.Sprite[];
  /** Floor machine and the hose to the tool, for hosed tools. */
  unit?: { obj: THREE.Group; hose: Hose };
  sparkles: { sprite: THREE.Sprite; x: number; y: number; layer: number; delay: number }[];
}

export interface Walkthrough {
  setProgress(t: number): void;
  resize(): void;
  dispose(): void;
}

export interface LoadEvents {
  /** 0–1 as textures, models and the sky arrive. */
  onProgress?: (p: number) => void;
  /** Everything is loaded and the first full frame has been drawn (or 15 s passed). */
  onReady?: () => void;
}

export function createWalkthrough(canvas: HTMLCanvasElement, events: LoadEvents = {}): Walkthrough {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = T.toTexture(T.sky(), [1, 1]);
  scene.fog = new THREE.Fog("#cdd8e1", 250, 4200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Neutral studio light until the real sky arrives, then the sky lights the scene.
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  // The sky photo is both the backdrop and the light/reflection source.
  new THREE.TextureLoader(manager).load("/assets/sky/backdrop.jpg", (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    scene.backgroundRotation.y = 1.2;
    scene.environment = pmrem.fromEquirectangular(t).texture;
    scene.environmentRotation.y = 1.2;
    scene.environmentIntensity = 1.1;
    request();
  });

  scene.add(new THREE.HemisphereLight("#e3ecf5", "#b6a58a", 0.55));
  const sun = new THREE.DirectionalLight("#fff0d8", 3.2);
  sun.position.set(-9, 14, 11);
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  for (const [x, y, z, i] of [
    [0, 2.6, -2.4, 5],
    [-4.6, 2.6, -3, 5],
    [3.6, 2.6, -3.2, 4],
    [-1.6, 2.6, -9.6, 6],
    [-4.3, 1.9, -7, 3],
  ]) {
    const l = new THREE.PointLight("#ffd9a8", i, 8, 2);
    l.position.set(x, y, z);
    scene.add(l);
  }

  const house = buildHouse(() => {
    renderer.shadowMap.needsUpdate = true;
    request();
  });
  scene.add(house.root);
  scene.add(buildSkyline());
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __scene: scene, __renderer: renderer });
  // Ground beyond the garden, fading into haze.
  const far = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: "#7d8f6a", roughness: 1 }));
  far.rotation.x = -Math.PI / 2;
  far.position.y = -0.06;
  scene.add(far);
  let ready = false;
  let readyTimer = 0;
  const markReady = () => {
    if (ready) return;
    ready = true;
    window.clearTimeout(readyTimer);
    request();
    // Reveal after the fully textured frame has been drawn (timer fallback for
    // background tabs, where animation frames are paused).
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      events.onReady?.();
    };
    requestAnimationFrame(() => requestAnimationFrame(reveal));
    window.setTimeout(reveal, 400);
  };
  manager.onProgress = (_url, loaded, total) => {
    request();
    events.onProgress?.(total ? loaded / total : 0);
  };
  manager.onLoad = () => {
    renderer.shadowMap.needsUpdate = true;
    markReady();
  };
  readyTimer = window.setTimeout(markReady, 15000); // never keep visitors waiting on a slow asset
  const S = house.surfaces;

  /* ── cleaning jobs ── */
  const dot = T.toTexture(T.softDot());
  const star = T.toTexture(T.sparkle());
  const sprite = (map: THREE.Texture, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity }));
    s.visible = false;
    s.renderOrder = 3;
    scene.add(s);
    return s;
  };
  const r = T.rng(71);
  const toward = (v: [number, number, number]) => () => new THREE.Vector3(...v);
  const job = (key: TaskKey, kind: ToolKind, layers: [Surface, HTMLCanvasElement, [number, number][], number, object?][], operator: (s: Surface) => THREE.Vector3, steam = false, unit?: { kind: UnitKind; at: [number, number, number]; rot: number }): Job => {
    const ls = layers.map(([s, grime, pts, brush, opts]) => {
      const dirt = new Dirt(s, grime, pts, brush, opts);
      scene.add(dirt.mesh);
      return { dirt, share: 0 };
    });
    const total = ls.reduce((a, l) => a + l.dirt.length, 0);
    ls.forEach((l) => (l.share = l.dirt.length / total));
    const tool = makeTool(kind);
    tool.visible = false;
    scene.add(tool);
    return {
      range: TASKS[key],
      layers: ls,
      tool,
      operator,
      steam: steam ? Array.from({ length: 12 }, () => sprite(dot)) : undefined,
      unit: unit
        ? (() => {
            const obj = makeUnit(unit.kind);
            obj.position.set(...unit.at);
            obj.rotation.y = unit.rot;
            obj.visible = false;
            const hose = new Hose();
            hose.mesh.visible = false;
            scene.add(obj, hose.mesh);
            return { obj, hose };
          })()
        : undefined,
      sparkles: Array.from({ length: 7 }, (_, i) => ({ sprite: sprite(star), x: 0.1 + r() * 0.8, y: 0.15 + r() * 0.7, layer: i % ls.length, delay: r() * 0.5 })),
    };
  };

  const jobs: Job[] = [
    job("floor", "mop", [[S.floor, T.floorGrime(S.floor.wm, S.floor.hm), strokes(S.floor, 0.46, "down", true), 0.46]], toward([0, 0, 1])),
    job("tiles", "brush", [[S.tiles, T.tileGrime(S.tiles.wm, S.tiles.hm, house.tileGrid, house.hotspots), strokes(S.tiles, 0.2, "across"), 0.2, { roughness: 0.5 }]], toward([0, -1, 0]), true),
    job("curtains", "steamer", [[S.curtains, T.curtainGrime(S.curtains.wm, S.curtains.hm), strokes(S.curtains, 0.34, "down"), 0.34, { segX: 240, side: THREE.DoubleSide }]], toward([0, -1, 0]), true, { kind: "steamer", at: [5.55, 0, -0.95], rot: -Math.PI / 2 }),
    job("carpet", "vacuum", [[S.carpet, T.carpetGrime(S.carpet.wm, S.carpet.hm), strokes(S.carpet, 0.4, "down", true), 0.4]], toward([0, 0, 1]), true),
    job(
      "sofa",
      "upholstery",
      [
        ...house.cushions.backs.map((s, i) => [s, T.cushionGrime(s.wm, s.hm, 67 + i), strokes(s, 0.2, "down"), 0.2] as [Surface, HTMLCanvasElement, [number, number][], number]),
        ...house.cushions.seats.map((s, i) => [s, T.cushionGrime(s.wm, s.hm, 77 + i), strokes(s, 0.2, "down", true), 0.2] as [Surface, HTMLCanvasElement, [number, number][], number]),
      ],
      // Back cushions: wand rises toward the viewer; seats: wand comes forward.
      (s) => (house.cushions.backs.includes(s) ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)),
      true,
      { kind: "extractor", at: [0.35, 0, -10.7], rot: -Math.PI / 2 },
    ),
    job("glass", "squeegee", [[S.glass, T.glassGrime(S.glass.wm, S.glass.hm), strokes(S.glass, 0.42, "down"), 0.42, { roughness: 0.5 }]], toward([0, -1, 0])),
  ];

  /* ── camera ── */
  const camera = new THREE.PerspectiveCamera(48, 1, 0.2, 3000);
  const curves = MOVES.map((mv) => ({
    ...mv,
    pos: new THREE.CatmullRomCurve3(mv.path.map((p) => new THREE.Vector3(...p)), false, "centripetal"),
    look: new THREE.CatmullRomCurve3(mv.look.map((p) => new THREE.Vector3(...p)), false, "centripetal"),
  }));
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  const placeCamera = (t: number) => {
    const mv = curves.find((c) => t <= c.t[1]) ?? curves[curves.length - 1];
    const k = span(t, mv.t);
    const e = mv.hold ? k : smoother(k);
    mv.pos.getPoint(e, camPos);
    mv.look.getPoint(e, camLook);
    // Portrait screens: step back from the subject so the whole job stays in frame.
    if (camera.aspect < 1) {
      const inside = clamp01((-camPos.z - 0.2) / 1.2);
      camLook.y -= (1 - inside) * 0.9; // outside: less sky, more house
      const pull = 1 + inside * Math.min(0.75, (1 / camera.aspect - 1) * 0.55);
      camPos.sub(camLook).multiplyScalar(pull).add(camLook);
      if (inside > 0) {
        camPos.x = Math.min(6.1, Math.max(-6.1, camPos.x));
        camPos.y = Math.min(2.85, camPos.y);
        camPos.z = Math.min(-0.2, Math.max(-12.1, camPos.z));
      }
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  };

  /* ── per-frame state ── */
  const tmp = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const applyJob = (j: Job, t: number) => {
    const p = span(t, j.range);
    let changed = false;
    // Which layer the tool is on, and how far along it.
    let acc = 0;
    let cur = 0;
    let local = 0;
    j.layers.forEach((l, i) => {
      const lp = clamp01((p - acc) / l.share);
      if (l.dirt.set(lp)) changed = true;
      if (p >= acc && (p < acc + l.share || i === j.layers.length - 1)) {
        cur = i;
        local = lp;
      }
      acc += l.share;
    });

    // Tool: slides in before the job, works, slides out after.
    const lead = 0.012;
    const enter = clamp01((t - (j.range[0] - lead)) / lead);
    const leave = clamp01((t - j.range[1]) / lead);
    const visible = enter > 0 && leave < 1;
    j.tool.visible = visible;
    if (j.unit) {
      j.unit.obj.visible = t > j.range[0] - 0.04 && t < j.range[1] + 0.03;
      j.unit.hose.mesh.visible = visible;
    }
    const layer = j.layers[cur].dirt;
    const pt = layer.at(local);
    if (visible) {
      const s = layer.s;
      pointOn(s, pt.x, pt.y, 0.004, tmp);
      nrm.copy(s.n); // curtain folds are shallow, so the tool stays square to the surface
      const op = j.operator(s);
      const wobble = Math.sin(local * layer.length * 5) * 0.08;
      const away = (1 - enter) + leave;
      tmp.addScaledVector(op.clone().normalize(), away * 1.2).addScaledVector(nrm, away * 0.3);
      poseTool(j.tool, tmp, nrm, op, wobble);
      if (j.unit) {
        j.tool.updateMatrixWorld(true);
        j.unit.obj.updateMatrixWorld(true);
        j.unit.hose.update(j.tool.getObjectByName("port")!.getWorldPosition(new THREE.Vector3()), j.unit.obj.getObjectByName("port")!.getWorldPosition(new THREE.Vector3()));
      }
    }

    // Steam: a short trail of puffs behind the tool, rising and fading.
    if (j.steam) {
      const working = p > 0 && p < 1;
      j.steam.forEach((sp, i) => {
        const age = i / j.steam!.length;
        sp.visible = working;
        if (!working) return;
        const q = layer.at(Math.max(0, local - age * 0.05));
        pointOn(layer.s, q.x, q.y, 0.05 + age * 0.3, tmp).addScaledVector(up, age * 0.25);
        sp.position.copy(tmp);
        sp.scale.setScalar(0.1 + age * 0.45);
        (sp.material as THREE.SpriteMaterial).opacity = 0.32 * (1 - age) * Math.min(1, p * 30, (1 - p) * 30);
      });
    }

    // Sparkles once the job is done.
    j.sparkles.forEach((s, i) => {
      const life = (t - j.range[1]) / 0.03 - s.delay;
      const on = life > 0 && life < 1;
      s.sprite.visible = on;
      if (!on) return;
      const l = j.layers[s.layer].dirt;
      pointOn(l.s, s.x, s.y, 0.03, tmp);
      s.sprite.position.copy(tmp);
      const k = Math.sin(Math.PI * life);
      s.sprite.scale.setScalar(0.05 + k * 0.16);
      (s.sprite.material as THREE.SpriteMaterial).opacity = k;
      (s.sprite.material as THREE.SpriteMaterial).rotation = i + life;
    });
    return changed;
  };

  let progress = 0;
  let lastShadowState = "";
  let frame = 0;

  const draw = () => {
    frame = 0;
    const t = progress;
    placeCamera(t);
    const g = smoother(span(t, GATE)) * 1.75;
    house.gate[0].rotation.y = g;
    house.gate[1].rotation.y = -g;
    house.door.rotation.y = smoother(span(t, DOOR)) * 1.65;
    const shadowState = `${g.toFixed(3)}|${house.door.rotation.y.toFixed(3)}`;
    if (shadowState !== lastShadowState) {
      renderer.shadowMap.needsUpdate = true;
      lastShadowState = shadowState;
    }
    for (const j of jobs) applyJob(j, t);
    renderer.render(scene, camera);
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const mobile = w < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 62 : 48;
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    request();
  };
  resize();

  return {
    setProgress(t: number) {
      progress = clamp01(t);
      request();
    },
    resize,
    dispose() {
      cancelAnimationFrame(frame);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      });
      pmrem.dispose();
      manager.onProgress = () => {};
      manager.onLoad = () => {};
      window.clearTimeout(readyTimer);
      renderer.dispose();
    },
  };
}
