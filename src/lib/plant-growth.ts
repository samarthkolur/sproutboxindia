import { CROP_CYCLE_DAYS } from "@/lib/constants";

// The timeline behind the landing page's seed-to-harvest animation. Everything the
// scene draws is a pure function of one number, `progress` (0 = sowing, 1 = harvest),
// so the animation can be scrubbed by scrolling and tested without WebGL.
//
// It follows the real sunflower schedule: sown and covered on day 1, cover
// removed on day 4, harvested on day 9 (see CROP_INSTRUCTIONS).

/** The crop the animation shows, and how many days it takes. */
export const GROW_DAYS = CROP_CYCLE_DAYS.sunflower;

/** Day the blackout cover comes off. Matches CROP_INSTRUCTIONS.sunflower[4]. */
export const COVER_OFF_DAY = 4;

/** Days on which the plants are watered (150 ml). Matches the sunflower instructions. */
export const WATER_DAYS = [4, 5, 7] as const;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** 0 before `edge0`, 1 after `edge1`, eased in between. */
export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Calendar day (1 to GROW_DAYS) for a progress value. */
export function dayAt(progress: number) {
  return 1 + clamp01(progress) * (GROW_DAYS - 1);
}

/** Progress value at which a calendar day starts. */
export function progressAtDay(day: number) {
  return clamp01((day - 1) / (GROW_DAYS - 1));
}

// ── Story stages (the text beside the animation) ─────────────────────────────

export interface GrowthStage {
  id: "sow" | "blackout" | "light" | "grow" | "harvest";
  /** First progress value at which this stage is active. */
  from: number;
}

export const STAGES: readonly GrowthStage[] = [
  { id: "sow", from: 0 },
  { id: "blackout", from: progressAtDay(1.9) },
  { id: "light", from: progressAtDay(COVER_OFF_DAY - 0.15) },
  { id: "grow", from: progressAtDay(COVER_OFF_DAY + 1.9) },
  { id: "harvest", from: progressAtDay(GROW_DAYS - 0.5) },
];

export function stageAt(progress: number) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) if (progress >= STAGES[i].from) index = i;
  return index;
}

// ── Scene-wide state ─────────────────────────────────────────────────────────

export interface SceneState {
  /** 0 = the hood is hovering away, 1 = it is down on the tray (day 1). */
  coverDrop: number;
  /** 0 = blackout cover on, 1 = fully lifted away (day 4). */
  coverLift: number;
  /** 0 = dark, 1 = full daylight: drives lights, light shafts and dust. */
  light: number;
  /** How much the page darkens behind the scene while the cover is on. */
  darkness: number;
  /** 0..1 while a watering is happening, otherwise -1. */
  water: number;
}

const WATER_WINDOW = 0.045; // in progress units: about 0.36 of a day

export function waterPhase(progress: number) {
  for (const day of WATER_DAYS) {
    const start = progressAtDay(day) + 0.012;
    if (progress >= start && progress <= start + WATER_WINDOW) return (progress - start) / WATER_WINDOW;
  }
  return -1;
}

/**
 * How wet the soil looks (0 dry, 1 just watered). Seeds are sown on moistened coir,
 * and each watering day soaks it again before it slowly dries.
 */
export function moisture(progress: number) {
  let wet = 0.55 * Math.exp(-(progress - progressAtDay(1)) * 4);
  for (const day of WATER_DAYS) {
    const start = progressAtDay(day) + 0.012;
    if (progress >= start) wet = Math.max(wet, Math.exp(-(progress - start) * 4.5));
  }
  return clamp01(wet);
}

export function sceneState(progress: number): SceneState {
  const lift = progressAtDay(COVER_OFF_DAY);
  // The scene opens in daylight on bare seeds (so the headline stays readable); the hood
  // comes down as the story starts, and goes away again on the day the instructions say.
  const coverDrop = smoothstep(0.015, 0.08, progress);
  const coverLift = smoothstep(lift - 0.015, lift + 0.07, progress);
  const covered = coverDrop * (1 - coverLift);
  return {
    coverDrop,
    coverLift,
    light: 1 - 0.5 * covered,
    darkness: 0.4 * covered,
    water: waterPhase(progress),
  };
}

// ── One plant ────────────────────────────────────────────────────────────────

export interface PlantGrowth {
  /** Seed swelling as it takes up water. */
  swell: number;
  /** Main root length. */
  root: number;
  /** Side roots. */
  lateral: number;
  /** Stem height. */
  stem: number;
  /** Seed leaves (cotyledons): size, how far open, and colour (0 pale yellow, 1 green). */
  cotyledonSize: number;
  cotyledonOpen: number;
  green: number;
  /** The first true leaves. */
  trueLeaf: number;
  /** Seed coat falling off. */
  hull: number;
}

/** Each plant starts a little later than its neighbours, so a tray never moves in lockstep. */
export function localProgress(progress: number, delay: number) {
  return clamp01((progress - delay) / (1 - delay));
}

export function plantGrowth(progress: number, delay = 0): PlantGrowth {
  const p = localProgress(progress, delay);
  return {
    swell: smoothstep(0, 0.1, p),
    root: smoothstep(0.06, 0.34, p),
    lateral: smoothstep(0.2, 0.55, p),
    // Etiolated plants stretch fast in the dark, then finish more slowly in the light.
    stem: 0.62 * smoothstep(0.1, 0.42, p) + 0.38 * smoothstep(0.5, 0.92, p),
    cotyledonSize: smoothstep(0.3, 0.7, p),
    cotyledonOpen: smoothstep(0.4, 0.64, p),
    green: smoothstep(0.42, 0.72, p),
    trueLeaf: smoothstep(0.64, 0.94, p),
    hull: smoothstep(0.38, 0.52, p),
  };
}

/** Camera framing: starts close on the seeds, pulls back to show the whole plant. */
export function cameraAt(progress: number) {
  const ease = smoothstep(0, 1, progress);
  return {
    distance: lerp(8.4, 13.2, ease),
    targetY: lerp(0.15, 1.45, ease),
    azimuth: lerp(-0.2, 0.1, ease), // radians
    elevation: lerp(0.36, 0.17, ease),
  };
}
