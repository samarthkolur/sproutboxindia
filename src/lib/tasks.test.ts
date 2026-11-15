// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CROP_INSTRUCTIONS } from "@/lib/constants";
import { countCheckinsDue, getTaskState, getTotalDays, isSameLocalDay, type TaskLike } from "./tasks";

const NOW = new Date(2026, 10, 15, 14, 0, 0); // 15 Nov 2026, local

function task(overrides: Partial<TaskLike> = {}): TaskLike {
  return {
    cropType: "sunflower",
    status: "IN_PROGRESS",
    sowDate: new Date(2026, 10, 10),
    harvestDate: new Date(2026, 10, 19),
    batches: [{ status: "GROWING", currentDay: 4, checkIns: [] }],
    ...overrides,
  };
}

describe("getTotalDays", () => {
  it("uses the crop cycle table first", () => {
    expect(getTotalDays({ cropType: "sunflower", sowDate: NOW, harvestDate: NOW })).toBe(9);
    expect(getTotalDays({ cropType: "wheatgrass", sowDate: NOW, harvestDate: NOW })).toBe(10);
  });

  it("falls back to the date difference for an unknown crop", () => {
    expect(
      getTotalDays({ cropType: "mystery", sowDate: new Date(2026, 10, 1), harvestDate: new Date(2026, 10, 6) })
    ).toBe(5);
  });

  it("falls back to 7 when the dates are identical", () => {
    expect(getTotalDays({ cropType: "mystery", sowDate: NOW, harvestDate: NOW })).toBe(7);
  });
});

describe("isSameLocalDay", () => {
  it("compares calendar days, not timestamps", () => {
    expect(isSameLocalDay(new Date(2026, 10, 15, 1, 0), NOW)).toBe(true);
    expect(isSameLocalDay(new Date(2026, 10, 14, 23, 59), NOW)).toBe(false);
  });
});

describe("getTaskState", () => {
  it("takes the current day from the furthest batch", () => {
    const state = getTaskState(
      task({
        batches: [
          { status: "GROWING", currentDay: 2 },
          { status: "GROWING", currentDay: 5 },
        ],
      }),
      NOW
    );
    expect(state.currentDay).toBe(5);
    expect(state.progress).toBe(Math.round((5 / 9) * 100));
  });

  it("caps progress at 100 and treats an overrun as a finished cycle", () => {
    const state = getTaskState(task({ batches: [{ status: "GROWING", currentDay: 14 }] }), NOW);
    expect(state.progress).toBe(100);
    expect(state.isCycleComplete).toBe(true);
  });

  it("skips harvested, rejected and QC-failed batches when picking the active one", () => {
    const state = getTaskState(
      task({
        batches: [
          { status: "HARVESTED", currentDay: 9 },
          { status: "REJECTED", currentDay: 9 },
          { status: "QC_FAILED", currentDay: 9 },
          { status: "GROWING", currentDay: 3 },
        ],
      }),
      NOW
    );
    expect(state.activeBatch?.status).toBe("GROWING");
  });

  it("detects a check-in made today and blocks a second one", () => {
    const state = getTaskState(
      task({ batches: [{ status: "GROWING", currentDay: 4, checkIns: [{ createdAt: new Date(2026, 10, 15, 8, 0) }] }] }),
      NOW
    );
    expect(state.checkedInToday).toBe(true);
    expect(state.canCheckIn).toBe(false);
  });

  it("allows a check-in when the last one was yesterday", () => {
    const state = getTaskState(
      task({ batches: [{ status: "GROWING", currentDay: 4, checkIns: [{ createdAt: new Date(2026, 10, 14, 20, 0) }] }] }),
      NOW
    );
    expect(state.canCheckIn).toBe(true);
  });

  it("offers check-in or pickup, never both", () => {
    const growing = getTaskState(task(), NOW);
    expect(growing.canCheckIn).toBe(true);
    expect(growing.canRequestPickup).toBe(false);

    const done = getTaskState(task({ batches: [{ status: "GROWING", currentDay: 9 }] }), NOW);
    expect(done.canCheckIn).toBe(false);
    expect(done.canRequestPickup).toBe(true);
  });

  it("offers nothing once the task is ready for pickup or harvested", () => {
    for (const status of ["HARVEST_READY", "HARVESTED", "CANCELLED"]) {
      const state = getTaskState(task({ status, batches: [{ status: "GROWING", currentDay: 9 }] }), NOW);
      expect(state.canCheckIn).toBe(false);
      expect(state.canRequestPickup).toBe(false);
    }
  });

  it("returns the next day's instruction for the crop", () => {
    const state = getTaskState(task(), NOW);
    expect(state.todayInstruction).toBe(CROP_INSTRUCTIONS.sunflower[5]);
  });

  it("handles a task with no batches", () => {
    const state = getTaskState(task({ batches: [] }), NOW);
    expect(state.currentDay).toBe(0);
    expect(state.activeBatch).toBeUndefined();
    expect(state.canCheckIn).toBe(false);
  });
});

describe("countCheckinsDue", () => {
  it("counts only tasks that can be checked in today", () => {
    const due = task();
    const checkedIn = task({ batches: [{ status: "GROWING", currentDay: 4, checkIns: [{ createdAt: NOW }] }] });
    const ready = task({ batches: [{ status: "GROWING", currentDay: 9 }] });
    expect(countCheckinsDue([due, checkedIn, ready], NOW)).toBe(1);
  });
});
