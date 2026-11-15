// @vitest-environment node
import { describe, expect, it } from "vitest";
import { TIERS, chooseTier, downgrade, forcedTier, shouldDowngrade, type DeviceSignals } from "./quality-tier";

const desktop: DeviceSignals = { webgl2: true, deviceMemory: 8, hardwareConcurrency: 12, devicePixelRatio: 2, width: 1920 };

describe("chooseTier", () => {
  it("gives a strong desktop the high tier", () => {
    expect(chooseTier(desktop)).toBe("high");
  });

  it("gives a modest desktop the medium tier", () => {
    expect(chooseTier({ ...desktop, deviceMemory: 4, hardwareConcurrency: 4 })).toBe("medium");
  });

  it("gives weak hardware the low tier", () => {
    expect(chooseTier({ ...desktop, deviceMemory: 2 })).toBe("low");
    expect(chooseTier({ ...desktop, hardwareConcurrency: 2 })).toBe("low");
  });

  it("falls back to low without WebGL 2", () => {
    expect(chooseTier({ ...desktop, webgl2: false })).toBe("low");
  });

  it("is conservative on phones: low unless the phone is clearly powerful", () => {
    const phone: DeviceSignals = { webgl2: true, deviceMemory: 4, hardwareConcurrency: 8, width: 390, touch: true };
    expect(chooseTier(phone)).toBe("low");
    expect(chooseTier({ ...phone, deviceMemory: 8 })).toBe("medium");
    expect(chooseTier({ ...phone, deviceMemory: 8, width: 700 })).toBe("medium"); // large touch screen
  });

  it("assumes a middling device when the browser does not say (Safari, Firefox)", () => {
    expect(chooseTier({ webgl2: true, width: 1440 })).toBe("medium");
  });
});

describe("tier settings", () => {
  it("get strictly cheaper from high to low", () => {
    for (const key of ["maxDpr", "particles", "plants"] as const) {
      expect(TIERS.high[key]).toBeGreaterThan(TIERS.medium[key]);
      expect(TIERS.medium[key]).toBeGreaterThan(TIERS.low[key]);
    }
  });

  it("drop post-processing only at the low tier, and bloom below high", () => {
    expect(TIERS.high.post && TIERS.medium.post).toBe(true);
    expect(TIERS.low.post).toBe(false);
    expect(TIERS.high.bloom).toBe(true);
    expect(TIERS.medium.bloom).toBe(false);
  });
});

describe("forcedTier", () => {
  it("reads ?q= and ignores anything else", () => {
    expect(forcedTier("?q=low")).toBe("low");
    expect(forcedTier("?a=1&q=high")).toBe("high");
    expect(forcedTier("?q=ultra")).toBeNull();
    expect(forcedTier("")).toBeNull();
  });
});

describe("downgrade", () => {
  it("steps down one tier at a time and stops at low", () => {
    expect(downgrade("high")).toBe("medium");
    expect(downgrade("medium")).toBe("low");
    expect(downgrade("low")).toBeNull();
  });
});

describe("shouldDowngrade", () => {
  const frames = (ms: number, count: number) => Array.from({ length: count }, () => ms);

  it("does nothing until it has a full window of frames", () => {
    expect(shouldDowngrade(frames(60, 30))).toBe(false);
  });

  it("downgrades when frames are consistently over budget", () => {
    expect(shouldDowngrade(frames(40, 60))).toBe(true);
  });

  it("keeps the tier when frames are fine", () => {
    expect(shouldDowngrade(frames(16, 120))).toBe(false);
  });

  it("ignores a single hitch (shader compile, tab switch)", () => {
    const samples = [...frames(16, 59), 900];
    expect(shouldDowngrade(samples)).toBe(false);
  });

  it("only looks at the most recent window, so a slow start does not count against a recovered device", () => {
    expect(shouldDowngrade([...frames(80, 200), ...frames(16, 60)])).toBe(false);
  });
});
