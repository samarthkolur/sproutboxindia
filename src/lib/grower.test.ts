// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  dayPlan,
  earningsSummary,
  fssaiState,
  greetingFor,
  maskValue,
  qcTile,
  sentenceForCheckins,
  taskFilterOf,
  weeklyEarnings,
} from "./grower";

const NOW = new Date(2026, 10, 15, 14, 0, 0);
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("greetingFor", () => {
  it("follows Indian time, not the server's", () => {
    expect(greetingFor(new Date("2026-11-15T03:00:00Z"))).toBe("Good morning"); // 08:30 IST
    expect(greetingFor(new Date("2026-11-15T08:00:00Z"))).toBe("Good afternoon"); // 13:30 IST
    expect(greetingFor(new Date("2026-11-15T14:00:00Z"))).toBe("Good evening"); // 19:30 IST
  });
});

describe("weeklyEarnings", () => {
  it("returns the requested number of windows, oldest first, with the newest ending now", () => {
    const buckets = weeklyEarnings([], NOW, 4);
    expect(buckets).toHaveLength(4);
    expect(buckets.map((b) => b.value)).toEqual([0, 0, 0, 0]);
  });

  it("puts each payout in the 7-day window it was paid in", () => {
    const buckets = weeklyEarnings(
      [
        { amount: 100, paidAt: daysAgo(1) }, // this week
        { amount: 50, paidAt: daysAgo(6) }, // this week
        { amount: 70, paidAt: daysAgo(9) }, // last week
        { amount: 30, paidAt: daysAgo(30) }, // outside 4 weeks
      ],
      NOW,
      4
    );
    expect(buckets.map((b) => b.value)).toEqual([0, 0, 70, 150]);
  });

  it("ignores payouts that were never paid", () => {
    expect(weeklyEarnings([{ amount: 999, paidAt: null }], NOW, 2).map((b) => b.value)).toEqual([0, 0]);
  });

  it("is not just the last seven payouts: two payouts in one week make one bar", () => {
    const buckets = weeklyEarnings(
      [
        { amount: 10, paidAt: daysAgo(1) },
        { amount: 20, paidAt: daysAgo(2) },
      ],
      NOW,
      3
    );
    expect(buckets.filter((b) => b.value > 0)).toHaveLength(1);
  });
});

describe("earningsSummary", () => {
  it("splits paid from pending, counting processing as pending and failed as neither", () => {
    expect(
      earningsSummary([
        { amount: 100, status: "PAID" },
        { amount: 40, status: "PENDING" },
        { amount: 10, status: "PROCESSING" },
        { amount: 500, status: "FAILED" },
      ])
    ).toEqual({ paid: 100, pending: 50 });
  });
});

describe("qcTile", () => {
  it("does not show the default 0.5 score as a result before any review", () => {
    const tile = qcTile(0.5, 0);
    expect(tile.value).toBe("—");
    expect(tile.caption).toMatch(/No reviews yet/);
    expect(tile.tone).toBe("neutral");
  });

  it("grades a reviewed score", () => {
    expect(qcTile(0.95, 4)).toMatchObject({ value: "95%", tone: "good" });
    expect(qcTile(0.8, 4)).toMatchObject({ value: "80%", tone: "neutral" });
    expect(qcTile(0.4, 4)).toMatchObject({ value: "40%", tone: "watch" });
  });
});

describe("fssaiState", () => {
  it("is verified, pending or missing", () => {
    expect(fssaiState({ fssaiRegNumber: "12345678901234", fssaiVerifiedAt: NOW })).toBe("FSSAI_VERIFIED");
    expect(fssaiState({ fssaiRegNumber: "12345678901234", fssaiVerifiedAt: null })).toBe("FSSAI_PENDING");
    expect(fssaiState({ fssaiRegNumber: null, fssaiVerifiedAt: null })).toBe("FSSAI_MISSING");
    expect(fssaiState({})).toBe("FSSAI_MISSING");
  });
});

describe("maskValue", () => {
  it("keeps only the last four characters", () => {
    expect(maskValue("123456789012")).toBe("••••••••9012");
  });
  it("masks short values fully and tolerates empty ones", () => {
    expect(maskValue("123")).toBe("•••");
    expect(maskValue(null)).toBe("");
    expect(maskValue(undefined)).toBe("");
  });
});

describe("taskFilterOf", () => {
  it("keeps ready-for-pickup tasks visible in their own list", () => {
    expect(taskFilterOf("ASSIGNED")).toBe("active");
    expect(taskFilterOf("IN_PROGRESS")).toBe("active");
    expect(taskFilterOf("HARVEST_READY")).toBe("pickup");
    expect(taskFilterOf("HARVESTED")).toBe("completed");
    expect(taskFilterOf("CANCELLED")).toBe("completed");
  });
});

describe("dayPlan", () => {
  it("has one step per day of the crop's cycle, from the real instructions", () => {
    const plan = dayPlan("sunflower", 3, true);
    expect(plan).toHaveLength(9);
    expect(plan[3].instruction).toMatch(/Remove cover tray/);
  });

  it("marks done days, one current day, then upcoming", () => {
    const states = dayPlan("sunflower", 3, true).map((step) => step.state);
    expect(states.slice(0, 3)).toEqual(["done", "done", "done"]);
    expect(states[3]).toBe("current");
    expect(states.slice(4).every((s) => s === "upcoming")).toBe(true);
  });

  it("has no current day once the task is closed", () => {
    expect(dayPlan("sunflower", 9, false).every((step) => step.state === "done")).toBe(true);
    expect(dayPlan("sunflower", 2, false).some((step) => step.state === "current")).toBe(false);
  });

  it("falls back to a generic step for an unknown crop", () => {
    expect(dayPlan("mystery", 0, true)[0].instruction).toMatch(/Water/);
  });
});

describe("sentenceForCheckins", () => {
  it("says what is due, or that nothing is", () => {
    expect(sentenceForCheckins(1, 3)).toBe("1 task needs a check-in today.");
    expect(sentenceForCheckins(2, 3)).toBe("2 tasks need a check-in today.");
    expect(sentenceForCheckins(0, 3)).toMatch(/all caught up/);
    expect(sentenceForCheckins(0, 0)).toMatch(/No trays are growing/);
  });
});
