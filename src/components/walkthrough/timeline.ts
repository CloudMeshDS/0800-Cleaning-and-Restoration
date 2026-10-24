/**
 * The walkthrough script, as fractions (0–1) of the whole scroll. Kept free of
 * three.js so the page can lay out captions before the 3D engine loads.
 *
 * World units are metres. The house's front wall is at z = 0, the street is
 * toward +z, and the rooms run back toward z = −12.5.
 */

export type Vec = [number, number, number];

/** A camera move: position and look-at target each follow a smooth curve. */
export interface Move {
  t: [number, number];
  path: Vec[];
  look: Vec[];
  /** "hold" moves drift gently at constant speed while a job is done. */
  hold?: boolean;
}

export const MOVES: Move[] = [
  // Street → front gate
  { t: [0, 0.1], path: [[0, 1.7, 19], [0, 1.68, 15], [0, 1.62, 11.2]], look: [[0, 2.4, 0], [0, 2.1, 0], [0, 1.8, 0]] },
  // Through the gate, up the path, in the front door, eyes down to the floor
  {
    t: [0.1, 0.165],
    path: [[0, 1.62, 11.2], [0, 1.62, 8.5], [0, 1.62, 4], [0, 1.65, 1.2], [0, 1.75, -0.35]],
    look: [[0, 1.8, 0], [0, 1.7, -2], [0, 1.5, -4], [0, 1, -4], [0, 0, -3]],
  },
  { t: [0.165, 0.285], hold: true, path: [[0, 1.75, -0.35], [0.12, 1.72, -0.5]], look: [[0, 0, -3], [0, 0, -2.95]] },
  // → kitchen splashback
  { t: [0.285, 0.335], path: [[0.12, 1.72, -0.5], [-1.6, 1.6, -2.2], [-3.9, 1.5, -3]], look: [[0, 0, -2.95], [-4.5, 1.1, -3.2], [-6.4, 1.22, -3]] },
  { t: [0.335, 0.445], hold: true, path: [[-3.9, 1.5, -3], [-4, 1.5, -2.9]], look: [[-6.4, 1.22, -3], [-6.4, 1.22, -3]] },
  // → curtains
  { t: [0.445, 0.495], path: [[-4, 1.5, -2.9], [-0.5, 1.55, -2.6], [2.0, 1.5, -3.1]], look: [[-6.4, 1.22, -3], [3, 1.3, -4], [6.4, 1.35, -3.1]] },
  { t: [0.495, 0.595], hold: true, path: [[2.0, 1.5, -3.1], [2.15, 1.5, -3]], look: [[6.4, 1.35, -3.1], [6.4, 1.35, -3.1]] },
  // → lounge rug
  { t: [0.595, 0.645], path: [[2.15, 1.5, -3], [1.4, 1.7, -5], [-1.6, 2, -6.4]], look: [[6.4, 1.35, -3.1], [1, 0.8, -9], [-1.6, 0, -9.9]] },
  { t: [0.645, 0.745], hold: true, path: [[-1.6, 2, -6.4], [-1.45, 1.95, -6.55]], look: [[-1.6, 0, -9.9], [-1.6, 0, -9.9]] },
  // → sofa
  { t: [0.745, 0.785], path: [[-1.45, 1.95, -6.55], [-1.6, 1.35, -8.9]], look: [[-1.6, 0, -9.9], [-1.6, 0.55, -11.8]] },
  { t: [0.785, 0.865], hold: true, path: [[-1.6, 1.35, -8.9], [-1.5, 1.33, -9]], look: [[-1.6, 0.55, -11.8], [-1.6, 0.55, -11.8]] },
  // → glass doors
  { t: [0.865, 0.905], path: [[-1.5, 1.33, -9], [1.6, 1.5, -8.6], [3.4, 1.5, -8.0]], look: [[-1.6, 0.55, -11.8], [1.5, 1, -12.4], [3.4, 1.3, -12.4]] },
  { t: [0.905, 0.965], hold: true, path: [[3.4, 1.5, -8.0], [3.3, 1.5, -8.15]], look: [[3.4, 1.3, -12.4], [3.4, 1.3, -12.4]] },
  // Pull back over the finished room
  { t: [0.965, 1], path: [[3.3, 1.5, -8.15], [3.0, 1.65, -7.4], [2.4, 1.7, -6.6]], look: [[3.4, 1.3, -12.4], [0.8, 0.8, -11.6], [-0.6, 0.7, -11.2]] },
];

export const GATE: [number, number] = [0.04, 0.085];
export const DOOR: [number, number] = [0.11, 0.138];

/** When each cleaning job runs. */
export const TASKS = {
  floor: [0.178, 0.272],
  tiles: [0.345, 0.435],
  curtains: [0.505, 0.585],
  carpet: [0.655, 0.735],
  sofa: [0.795, 0.855],
  glass: [0.912, 0.958],
} as const;

export type TaskKey = keyof typeof TASKS;

export const FINALE = 0.97;
