import {
  EXPERIMENT_KEYS,
  EXPERIMENTS,
  getExperiment,
  type Assignments,
  type Experiment,
} from "./config";

/** FNV-1a 32-bit hash. Pure and edge-safe, so the same input gives the same bucket everywhere. */
export function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * MurmurHash3 32-bit finalizer. FNV-1a alone leaves its high bits biased for
 * similar inputs (≈52/48 instead of 50/50), so mix before bucketing.
 */
export function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Deterministic bucketing: the same visitor always gets the same variant
 * of an experiment, and different experiments bucket independently.
 */
export function assignVariant(exp: Experiment, visitorId: string): string {
  const control = exp.variants[0].key;
  if (exp.status === "concluded") return exp.winner ?? control;
  if (exp.status !== "running") return control;

  const bucket = fmix32(hash32(`v1:${exp.key}:${visitorId}`)) / 0x100000000; // [0, 1)
  let acc = 0;
  for (const v of exp.variants) {
    acc += v.weight;
    if (bucket < acc) return v.key;
  }
  return control;
}

/**
 * Parses a QA override such as "hero_headline:b,nav_cta_label:b".
 * Unknown experiments and variants are ignored.
 */
export function parseForce(raw: string | null | undefined): Partial<Assignments> {
  const out: Partial<Assignments> = {};
  if (!raw) return out;
  for (const pair of raw.split(",")) {
    const [key, variant] = pair.split(":").map((s) => s?.trim());
    const exp = key ? getExperiment(key) : undefined;
    if (exp && exp.variants.some((v) => v.key === variant)) {
      out[key as keyof Assignments] = variant;
    }
  }
  return out;
}

export function assignAll(
  visitorId: string,
  opts: { isBot?: boolean; force?: Partial<Assignments> } = {}
): Assignments {
  const result = {} as Assignments;
  for (const key of EXPERIMENT_KEYS) {
    const exp: Experiment = EXPERIMENTS[key];
    result[key] = opts.isBot
      ? exp.variants[0].key
      : opts.force?.[key] ?? assignVariant(exp, visitorId);
  }
  return result;
}
