// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  INTRO_FROM,
  PAGE_CANVAS,
  RAIL,
  easeOutCubic,
  railAt,
  skyAt,
  transitionsAt,
  undergroundAt,
} from "./acts";
import { COVER_OFF_DAY, progressAtDay } from "./plant-growth";

const STEPS = Array.from({ length: 401 }, (_, i) => i / 400);
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("camera rail", () => {
  it("passes exactly through its keys", () => {
    for (const key of RAIL) {
      const at = railAt(key.at);
      expect(distance(at.position, key.position)).toBeLessThan(1e-9);
      expect(distance(at.target, key.target)).toBeLessThan(1e-9);
    }
  });

  it("has keys in strictly increasing order from 0 to 1", () => {
    expect(RAIL[0].at).toBe(0);
    expect(RAIL.at(-1)?.at).toBe(1);
    for (let i = 1; i < RAIL.length; i++) expect(RAIL[i].at).toBeGreaterThan(RAIL[i - 1].at);
  });

  it("never produces a non-finite value, and clamps outside 0 to 1", () => {
    for (const p of [...STEPS, -1, 2]) {
      const { position, target } = railAt(p);
      for (const value of [...position, ...target]) expect(Number.isFinite(value)).toBe(true);
    }
    expect(railAt(-1).position).toEqual(railAt(0).position);
    expect(railAt(5).position).toEqual(railAt(1).position);
  });

  it("moves smoothly: no jump larger than a fraction of the scene between neighbouring steps", () => {
    for (let i = 1; i < STEPS.length; i++) {
      expect(distance(railAt(STEPS[i]).position, railAt(STEPS[i - 1]).position)).toBeLessThan(0.45);
      expect(distance(railAt(STEPS[i]).target, railAt(STEPS[i - 1]).target)).toBeLessThan(0.3);
    }
  });

  it("has no sudden change of direction at a key (the path is smooth, not a polyline)", () => {
    const eps = 0.0005;
    for (const key of RAIL.slice(1, -1)) {
      const before = railAt(key.at - eps).position;
      const here = railAt(key.at).position;
      const after = railAt(key.at + eps).position;
      const v1 = [here[0] - before[0], here[1] - before[1], here[2] - before[2]];
      const v2 = [after[0] - here[0], after[1] - here[1], after[2] - here[2]];
      const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
      expect(dot / (Math.hypot(...v1) * Math.hypot(...v2) || 1)).toBeGreaterThan(0.9);
    }
  });

  it("goes below the soil while the seeds are covered and back above it after the cover is removed", () => {
    const y = (p: number) => railAt(p).position[1];
    expect(y(0)).toBeGreaterThan(0);
    expect(y(progressAtDay(2.5))).toBeLessThan(-1);
    expect(y(progressAtDay(COVER_OFF_DAY + 0.6))).toBeGreaterThan(0);
  });

  it("ends pulled back, further from the plants than it passes through them", () => {
    const depth = (p: number) => railAt(p).position[2];
    expect(depth(1)).toBeGreaterThan(depth(0.82));
  });
});

describe("transitions", () => {
  it("fire at the dive and at the surface, and nowhere else", () => {
    const at = (p: number) => transitionsAt(p);
    expect(at(0.11).dive).toBe(1);
    expect(at(0.11).strength).toBe(1);
    expect(at(0.28).strength).toBe(0);
    expect(at(0.7).strength).toBe(0);
    expect(at(0).strength).toBe(0);
    expect(at(1).strength).toBe(0);
  });

  it("peak after the hood lifts, because the surface transition is the cover coming off", () => {
    const peak = STEPS.reduce((best, p) => (transitionsAt(p).surface > transitionsAt(best).surface ? p : best), 0);
    expect(peak).toBeGreaterThan(progressAtDay(COVER_OFF_DAY));
    expect(peak).toBeLessThan(progressAtDay(COVER_OFF_DAY + 1));
  });

  it("stay within 0 to 1", () => {
    for (const p of STEPS) {
      const t = transitionsAt(p);
      for (const value of [t.dive, t.surface, t.strength]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("underground", () => {
  it("is 0 above the soil and 1 in the middle of the dark act", () => {
    expect(undergroundAt(0)).toBe(0);
    expect(undergroundAt(0.25)).toBe(1);
    expect(undergroundAt(0.8)).toBe(0);
  });
});

describe("sky", () => {
  it("opens and closes on the page's own canvas colour, so the hand-over to the page has no seam", () => {
    for (const p of [0, 1]) {
      const { color } = skyAt(p);
      color.forEach((channel, i) => expect(channel).toBeCloseTo(PAGE_CANVAS[i], 10));
    }
  });

  it("is dark under the soil and bright in the light", () => {
    const luminance = (p: number) => {
      const [r, g, b] = skyAt(p).color;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect(luminance(0.2)).toBeLessThan(0.15);
    expect(luminance(0.7)).toBeGreaterThan(0.7);
    expect(luminance(0)).toBeGreaterThan(0.7);
  });

  it("changes smoothly and keeps every channel in range", () => {
    let previous = skyAt(0);
    for (const p of STEPS) {
      const now = skyAt(p);
      for (let i = 0; i < 3; i++) {
        expect(now.color[i]).toBeGreaterThanOrEqual(0);
        expect(now.color[i]).toBeLessThanOrEqual(1);
        expect(Math.abs(now.color[i] - previous.color[i])).toBeLessThan(0.1);
      }
      expect(now.fog).toBeGreaterThan(0);
      previous = now;
    }
  });
});

describe("intro", () => {
  it("starts high above the field, and easing runs from 0 to 1", () => {
    expect(INTRO_FROM.position[1]).toBeGreaterThan(railAt(0).position[1]);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
