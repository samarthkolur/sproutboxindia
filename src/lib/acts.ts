import { COVER_OFF_DAY, clamp01, lerp, progressAtDay, smoothstep } from "@/lib/plant-growth";

// The directing of the landing-page journey: where the camera is, what colour the
// world is, and when a shader transition fires, all as pure functions of scroll
// progress (0 to 1). No three.js here, so the whole script is unit-tested.
//
// The acts follow the real sunflower schedule (see plant-growth.ts): the camera goes
// under the soil while the seeds sit under the blackout hood, and comes back up on
// the day the cover is removed.

export type Vec3 = readonly [number, number, number];

// ── Camera rail ──────────────────────────────────────────────────────────────

interface RailKey {
  at: number;
  position: Vec3;
  target: Vec3;
}

const SURFACE_DIVE = 0.11; // the camera crosses below the soil
const SURFACE_EXIT = progressAtDay(COVER_OFF_DAY) + 0.04; // ...and comes back up after the cover lifts

export const RAIL: readonly RailKey[] = [
  { at: 0.0, position: [0, 3.4, 10.5], target: [0, 0.5, 0] }, // seeds on the surface
  { at: 0.07, position: [1.6, 1.3, 5.2], target: [0, 0.1, 0] },
  { at: SURFACE_DIVE, position: [0.9, -0.4, 4.2], target: [0, -1.1, 0] }, // dive
  { at: 0.2, position: [-1.4, -2.2, 4.4], target: [0, -2.1, 0] }, // roots, in the dark
  { at: 0.32, position: [1.8, -2.6, 4.0], target: [0, -2.3, 0] },
  { at: SURFACE_EXIT - 0.03, position: [0.4, -1.1, 4.6], target: [0, -0.2, 0] },
  { at: SURFACE_EXIT, position: [0.2, 0.9, 5.6], target: [0, 1.3, 0] }, // out into the light
  { at: 0.62, position: [2.4, 2.3, 4.2], target: [0, 2.4, 0] }, // climbing the stalks
  { at: 0.82, position: [0.5, 3.7, 2.6], target: [0, 3.5, 0] }, // inside the canopy
  { at: 1.0, position: [0, 5.2, 14], target: [0, 1.9, 0] }, // pull back to the whole tray
];

function hermite(p0: number, p1: number, m0: number, m1: number, h: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m1;
}

/** Cubic Hermite through the keys, with finite-difference tangents (smooth even though keys are unevenly spaced). */
function sample(keys: readonly RailKey[], pick: (key: RailKey) => Vec3, progress: number): [number, number, number] {
  const p = clamp01(progress);
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].at) i++;
  const a = keys[Math.max(0, i - 1)];
  const b = keys[i];
  const c = keys[i + 1];
  const d = keys[Math.min(keys.length - 1, i + 2)];
  const h = c.at - b.at;
  const t = h === 0 ? 0 : (p - b.at) / h;

  const out: [number, number, number] = [0, 0, 0];
  for (let axis = 0; axis < 3; axis++) {
    const pb = pick(b)[axis];
    const pc = pick(c)[axis];
    const m0 = (pc - pick(a)[axis]) / Math.max(1e-6, c.at - a.at);
    const m1 = (pick(d)[axis] - pb) / Math.max(1e-6, d.at - b.at);
    out[axis] = hermite(pb, pc, m0, m1, h, t);
  }
  return out;
}

export function railAt(progress: number) {
  return {
    position: sample(RAIL, (key) => key.position, progress),
    target: sample(RAIL, (key) => key.target, progress),
  };
}

// ── Transitions (strength 0 to 1) ────────────────────────────────────────────

function pulse(progress: number, center: number, halfWidth: number) {
  return 1 - smoothstep(0, halfWidth, Math.abs(progress - center));
}

export interface Transitions {
  /** Diving into the soil. */
  dive: number;
  /** Coming back out into the light. */
  surface: number;
  /** Whichever is stronger: drives displacement and chromatic aberration. */
  strength: number;
}

export function transitionsAt(progress: number): Transitions {
  const dive = pulse(progress, SURFACE_DIVE, 0.045);
  const surface = pulse(progress, SURFACE_EXIT, 0.04);
  return { dive, surface, strength: Math.max(dive, surface) };
}

/** 1 while the camera is under the surface, with soft edges. */
export function undergroundAt(progress: number) {
  return smoothstep(SURFACE_DIVE - 0.02, SURFACE_DIVE + 0.025, progress) * (1 - smoothstep(SURFACE_EXIT - 0.03, SURFACE_EXIT + 0.01, progress));
}

// ── World colour ─────────────────────────────────────────────────────────────

export type Rgb = readonly [number, number, number];

const hex = (value: string): Rgb => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// The scene opens and closes on the page's own canvas colour (--c-canvas), so the
// 3D world hands over to the rest of the landing page without a seam.
export const PAGE_CANVAS = hex("#e2eddc");

const SKY: readonly { at: number; color: Rgb; fog: number }[] = [
  { at: 0, color: PAGE_CANVAS, fog: 0.03 },
  { at: SURFACE_DIVE - 0.03, color: hex("#d3e3cc"), fog: 0.04 },
  { at: SURFACE_DIVE + 0.03, color: hex("#0e1812"), fog: 0.1 }, // under the soil
  { at: SURFACE_EXIT - 0.03, color: hex("#101c15"), fog: 0.1 },
  { at: SURFACE_EXIT + 0.03, color: hex("#f3f4d4"), fog: 0.035 }, // sunrise: pale warm light
  { at: 0.65, color: hex("#dcecd0"), fog: 0.03 },
  { at: 1, color: PAGE_CANVAS, fog: 0.02 },
];

export function skyAt(progress: number): { color: [number, number, number]; fog: number } {
  const p = clamp01(progress);
  let i = 0;
  while (i < SKY.length - 2 && p > SKY[i + 1].at) i++;
  const a = SKY[i];
  const b = SKY[i + 1];
  const t = smoothstep(a.at, b.at, p);
  return {
    color: [lerp(a.color[0], b.color[0], t), lerp(a.color[1], b.color[1], t), lerp(a.color[2], b.color[2], t)],
    fog: lerp(a.fog, b.fog, t),
  };
}

// ── Intro ────────────────────────────────────────────────────────────────────

export const INTRO_SECONDS = 3.6;

/** Start of the intro move: high above the field, looking down at the seed. */
export const INTRO_FROM = { position: [0, 15, 20] as Vec3, target: [0, 0, 0] as Vec3 };

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
