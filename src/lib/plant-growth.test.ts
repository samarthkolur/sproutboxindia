// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CROP_INSTRUCTIONS } from "@/lib/constants";
import {
  COVER_OFF_DAY,
  GROW_DAYS,
  STAGES,
  WATER_DAYS,
  cameraAt,
  dayAt,
  localProgress,
  moisture,
  plantGrowth,
  progressAtDay,
  sceneState,
  smoothstep,
  stageAt,
  waterPhase,
  type PlantGrowth,
} from "./plant-growth";

const STEPS = Array.from({ length: 201 }, (_, i) => i / 200);

describe("the animation follows the real sunflower schedule", () => {
  it("runs for as many days as sunflower takes", () => {
    expect(GROW_DAYS).toBe(9);
    expect(dayAt(0)).toBe(1);
    expect(dayAt(1)).toBe(GROW_DAYS);
  });

  it("removes the cover on the day the grower instructions say to", () => {
    expect(CROP_INSTRUCTIONS.sunflower[COVER_OFF_DAY]).toMatch(/remove cover/i);
    expect(CROP_INSTRUCTIONS.sunflower[COVER_OFF_DAY - 1]).not.toMatch(/remove cover/i);
  });

  it("waters on days the instructions mention 150 ml", () => {
    for (const day of WATER_DAYS) expect(CROP_INSTRUCTIONS.sunflower[day]).toMatch(/water 150ml/i);
  });

  it("ends on the harvest day", () => {
    expect(CROP_INSTRUCTIONS.sunflower[GROW_DAYS]).toMatch(/harvest/i);
  });

  it("converts between days and progress both ways", () => {
    for (let day = 1; day <= GROW_DAYS; day++) expect(dayAt(progressAtDay(day))).toBeCloseTo(day, 10);
  });
});

describe("stages", () => {
  it("start at zero and strictly increase", () => {
    expect(STAGES[0].from).toBe(0);
    for (let i = 1; i < STAGES.length; i++) expect(STAGES[i].from).toBeGreaterThan(STAGES[i - 1].from);
  });

  it("activate the light stage just before the cover comes off, and harvest at the end", () => {
    const light = STAGES.findIndex((s) => s.id === "light");
    expect(stageAt(progressAtDay(COVER_OFF_DAY - 1))).toBeLessThan(light);
    expect(stageAt(progressAtDay(COVER_OFF_DAY))).toBe(light);
    expect(stageAt(1)).toBe(STAGES.length - 1);
    expect(STAGES.at(-1)?.id).toBe("harvest");
  });

  it("always returns a valid stage, even outside 0 to 1", () => {
    expect(stageAt(-1)).toBe(0);
    expect(stageAt(5)).toBe(STAGES.length - 1);
  });
});

describe("scene state", () => {
  it("opens in daylight on bare seeds, so the headline is readable", () => {
    const start = sceneState(0);
    expect(start.coverDrop).toBe(0);
    expect(start.coverLift).toBe(0);
    expect(start.light).toBe(1);
    expect(start.darkness).toBe(0);
  });

  it("puts the hood on during day 1 and is dark and covered by day 3", () => {
    expect(sceneState(progressAtDay(1.9)).coverDrop).toBe(1);
    const dark = sceneState(progressAtDay(3));
    expect(dark.light).toBeLessThan(0.55);
    expect(dark.darkness).toBeGreaterThan(0.3);
  });

  it("lifts the cover around day 4 and not before day 3", () => {
    expect(sceneState(progressAtDay(3)).coverLift).toBe(0);
    expect(sceneState(progressAtDay(COVER_OFF_DAY + 0.5)).coverLift).toBeGreaterThan(0.5);
  });

  it("ends in full light with the cover gone", () => {
    const end = sceneState(1);
    expect(end.coverLift).toBe(1);
    expect(end.light).toBe(1);
    expect(end.darkness).toBe(0);
  });

  it("only ever lowers the hood and then lifts it, never the reverse", () => {
    let previous = sceneState(0);
    for (const p of STEPS) {
      const now = sceneState(p);
      expect(now.coverDrop).toBeGreaterThanOrEqual(previous.coverDrop - 1e-12);
      expect(now.coverLift).toBeGreaterThanOrEqual(previous.coverLift - 1e-12);
      previous = now;
    }
  });

  it("gets darker while the hood is on, then brighter once it lifts", () => {
    const light = (day: number) => sceneState(progressAtDay(day)).light;
    expect(light(1)).toBeGreaterThan(light(2));
    expect(light(2)).toBeGreaterThanOrEqual(light(3));
    expect(light(5)).toBeGreaterThan(light(3));
  });

  it("waters during the watering days only", () => {
    for (const day of WATER_DAYS) expect(waterPhase(progressAtDay(day) + 0.03)).toBeGreaterThanOrEqual(0);
    expect(waterPhase(progressAtDay(2))).toBe(-1);
    expect(waterPhase(progressAtDay(8.5))).toBe(-1);
    expect(waterPhase(0)).toBe(-1);
  });
});

describe("moisture", () => {
  it("stays within 0 to 1", () => {
    for (const p of STEPS) {
      expect(moisture(p)).toBeGreaterThanOrEqual(0);
      expect(moisture(p)).toBeLessThanOrEqual(1);
    }
  });

  it("is soaked right after a watering day and drier a day later", () => {
    for (const day of WATER_DAYS) {
      const justWatered = moisture(progressAtDay(day) + 0.02);
      const nextDay = moisture(progressAtDay(day + 1) + 0.02);
      expect(justWatered).toBeGreaterThan(0.8);
      if (!WATER_DAYS.includes((day + 1) as never)) expect(nextDay).toBeLessThan(justWatered);
    }
  });

  it("starts moist (the seeds are sown on damp coir)", () => {
    expect(moisture(0)).toBeGreaterThan(0.4);
  });
});

describe("plant growth", () => {
  const channels = Object.keys(plantGrowth(0)) as (keyof PlantGrowth)[];

  it("starts as an unsprouted seed", () => {
    expect(plantGrowth(0)).toEqual({
      swell: 0, root: 0, lateral: 0, stem: 0, cotyledonSize: 0, cotyledonOpen: 0, green: 0, trueLeaf: 0, hull: 0,
    });
  });

  it("is fully grown at harvest for every plant, however late it started", () => {
    for (const delay of [0, 0.03, 0.06, 0.1]) {
      for (const channel of channels) expect(plantGrowth(1, delay)[channel]).toBeCloseTo(1, 10);
    }
  });

  it("only ever grows: no channel goes backwards, and all stay within 0 to 1", () => {
    for (const delay of [0, 0.05, 0.1]) {
      let previous = plantGrowth(0, delay);
      for (const p of STEPS) {
        const now = plantGrowth(p, delay);
        for (const channel of channels) {
          expect(now[channel], `${channel} at ${p}`).toBeGreaterThanOrEqual(previous[channel] - 1e-12);
          expect(now[channel]).toBeGreaterThanOrEqual(0);
          expect(now[channel]).toBeLessThanOrEqual(1 + 1e-12);
        }
        previous = now;
      }
    }
  });

  it("tells the story in order: roots, then stem, then leaves open and turn green, then true leaves", () => {
    const at = (channel: keyof PlantGrowth, target: number) => STEPS.find((p) => plantGrowth(p)[channel] >= target)!;
    expect(at("root", 0.5)).toBeLessThan(at("stem", 0.5));
    expect(at("stem", 0.5)).toBeLessThan(at("cotyledonOpen", 0.5));
    expect(at("cotyledonOpen", 0.5)).toBeLessThan(at("trueLeaf", 0.5));
    expect(at("green", 0.5)).toBeGreaterThan(progressAtDay(COVER_OFF_DAY - 0.5));
  });

  it("keeps the leaves shut and pale while the cover is still on", () => {
    const underCover = plantGrowth(progressAtDay(COVER_OFF_DAY - 1));
    expect(underCover.cotyledonOpen).toBe(0);
    expect(underCover.green).toBe(0);
    expect(underCover.stem).toBeGreaterThan(0.2); // but it has already stretched in the dark
  });

  it("staggers plants so a tray does not move in lockstep", () => {
    // Compare while they are still growing (later, both have finished the first phase).
    const early = plantGrowth(0.25, 0);
    const late = plantGrowth(0.25, 0.08);
    expect(late.stem).toBeLessThan(early.stem);
    expect(late.root).toBeLessThan(early.root);
  });

  it("clamps local progress", () => {
    expect(localProgress(0, 0.1)).toBe(0);
    expect(localProgress(1, 0.1)).toBe(1);
  });
});

describe("camera", () => {
  it("starts close on the seeds and pulls back as the plant grows", () => {
    expect(cameraAt(0).distance).toBeLessThan(cameraAt(1).distance);
    expect(cameraAt(0).targetY).toBeLessThan(cameraAt(1).targetY);
  });

  it("moves smoothly (no jumps between neighbouring steps)", () => {
    for (let i = 1; i < STEPS.length; i++) {
      expect(Math.abs(cameraAt(STEPS[i]).distance - cameraAt(STEPS[i - 1]).distance)).toBeLessThan(0.2);
    }
  });
});

describe("smoothstep", () => {
  it("is 0 below, 1 above and 0.5 in the middle", () => {
    expect(smoothstep(2, 4, 1)).toBe(0);
    expect(smoothstep(2, 4, 5)).toBe(1);
    expect(smoothstep(2, 4, 3)).toBe(0.5);
  });
});
