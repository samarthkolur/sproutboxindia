// How much work the 3D world does on a given device. Chosen once from device
// signals, then lowered at runtime if the frame rate cannot keep up (the site this
// is modelled on measures performance continuously and adapts the same way).

export type Tier = "high" | "medium" | "low";

export interface TierSettings {
  /** Upper limit for the device pixel ratio. */
  maxDpr: number;
  /** Floating pollen and root-flow particles. */
  particles: number;
  /** Stalks in the field. */
  plants: number;
  /** Post-processing (transitions, chromatic aberration, grain). */
  post: boolean;
  /** Glow on bright areas. */
  bloom: boolean;
  /** Anti-aliasing on the canvas. */
  antialias: boolean;
}

export const TIERS: Record<Tier, TierSettings> = {
  high: { maxDpr: 2, particles: 60000, plants: 160, post: true, bloom: true, antialias: true },
  medium: { maxDpr: 1.5, particles: 24000, plants: 90, post: true, bloom: false, antialias: false },
  low: { maxDpr: 1, particles: 8000, plants: 40, post: false, bloom: false, antialias: false },
};

export interface DeviceSignals {
  webgl2: boolean;
  /** navigator.deviceMemory, in GB (Chromium only). */
  deviceMemory?: number;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
  /** Viewport width in CSS pixels. */
  width: number;
  /** Coarse pointer (touch) device. */
  touch?: boolean;
}

export function isTier(value: unknown): value is Tier {
  return value === "high" || value === "medium" || value === "low";
}

/** `?q=low` (or medium, high) forces a tier. Used for testing and as a support escape hatch. */
export function forcedTier(search: string): Tier | null {
  const value = new URLSearchParams(search).get("q");
  return isTier(value) ? value : null;
}

export function chooseTier(signals: DeviceSignals): Tier {
  if (!signals.webgl2) return "low";
  const memory = signals.deviceMemory ?? 4;
  const cores = signals.hardwareConcurrency ?? 4;
  const phone = signals.width < 640 || Boolean(signals.touch && signals.width < 900);

  if (memory <= 2 || cores <= 2) return "low";
  if (phone) return memory >= 6 && cores >= 8 ? "medium" : "low";
  if (memory >= 8 && cores >= 8) return "high";
  return "medium";
}

export function downgrade(tier: Tier): Tier | null {
  return tier === "high" ? "medium" : tier === "medium" ? "low" : null;
}

/**
 * True when the recent frames are consistently too slow. Needs a full window of
 * samples, so a single hitch (shader compile, tab switch) never triggers it.
 */
export function shouldDowngrade(frameMs: readonly number[], options: { budgetMs?: number; window?: number } = {}) {
  const budget = options.budgetMs ?? 24;
  const window = options.window ?? 60;
  if (frameMs.length < window) return false;
  const recent = frameMs.slice(-window);
  const slow = recent.filter((ms) => ms > budget).length;
  return slow / window > 0.6;
}
