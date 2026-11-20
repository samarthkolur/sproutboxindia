/* ────────────────────────────────────────────────────────────
   A/B experiment registry — the single place to add, start,
   stop or conclude an experiment. See EXPERIMENTS.md.

   status:
     draft     → everyone sees control, nothing is tracked
     running   → visitors are split by weight, exposures tracked
     paused    → everyone sees control, nothing is tracked
     concluded → everyone sees `winner`, nothing is tracked
   ──────────────────────────────────────────────────────────── */

export type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

export type Variant = {
  key: string;
  /** Share of traffic, 0–1. Weights in one experiment must sum to 1. */
  weight: number;
};

export type Experiment = {
  key: string;
  description: string;
  status: ExperimentStatus;
  /** The first variant is always the control. */
  variants: Variant[];
  /** GA4 event that decides the winner. */
  primaryMetric: string;
  /** Page area this experiment changes — only one running experiment per area. */
  area: string;
  winner?: string;
};

const fiftyFifty: Variant[] = [
  { key: "control", weight: 0.5 },
  { key: "b", weight: 0.5 },
];

export const EXPERIMENTS = {
  hero_headline: {
    key: "hero_headline",
    description: "Landing hero: 'Farm-to-fork, door to door.' vs a benefit-led headline",
    status: "running",
    variants: fiftyFifty,
    primaryMetric: "cta_click",
    area: "landing_hero_copy",
  },
  hero_cta_order: {
    key: "hero_cta_order",
    description: "Landing hero: grower CTA first (control) vs restaurant CTA first",
    status: "draft",
    variants: fiftyFifty,
    primaryMetric: "cta_click",
    area: "landing_hero_cta",
  },
  nav_cta_label: {
    key: "nav_cta_label",
    description: "Navbar button: 'Get Started' vs 'Join the Network'",
    status: "draft",
    variants: fiftyFifty,
    primaryMetric: "cta_click",
    area: "landing_nav",
  },
  grower_form_length: {
    key: "grower_form_length",
    description: "Grower sign-up: 5 steps (control) vs 3 steps, UPI collected later",
    status: "draft",
    variants: fiftyFifty,
    primaryMetric: "sign_up",
    area: "grower_signup",
  },
} as const satisfies Record<string, Experiment>;

export type ExperimentKey = keyof typeof EXPERIMENTS;

/** Variant chosen for each experiment, e.g. { hero_headline: "b" }. */
export type Assignments = Record<ExperimentKey, string>;

export const EXPERIMENT_KEYS = Object.keys(EXPERIMENTS) as ExperimentKey[];

export function getExperiment(key: string): Experiment | undefined {
  return (EXPERIMENTS as Record<string, Experiment>)[key];
}

export function isTracked(key: ExperimentKey): boolean {
  return getExperiment(key)?.status === "running";
}
