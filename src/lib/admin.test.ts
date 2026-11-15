// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// lib/business pulls in Prisma; only its pure maths is compared here.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { calculateProductionPlan } from "@/lib/business";
import { daysUntil, planOrder, sortByUrgency, urgencyOf, waitingFor } from "./admin";

const NOW = new Date(2026, 10, 15, 14, 0);
const inDays = (n: number) => new Date(2026, 10, 15 + n);

describe("planOrder", () => {
  it("needs a base tray per 200 g, plus a 25% buffer", () => {
    expect(planOrder({ cropType: "sunflower", quantityKg: 3, deliveryDate: inDays(20) })).toMatchObject({ baseTrays: 15, bufferTrays: 4, totalTrays: 19, bufferPercent: 0.25 });
    expect(planOrder({ cropType: "pea-shoots", quantityKg: 3.5, deliveryDate: inDays(20) })).toMatchObject({ baseTrays: 18, bufferTrays: 5, totalTrays: 23 });
  });

  it("agrees with calculateProductionPlan, the other place the tray maths exists", () => {
    for (const [crop, kg] of [["sunflower", 3], ["radish", 0.5], ["wheatgrass", 12.5], ["mustard", 7]] as const) {
      const [expected] = calculateProductionPlan([{ cropType: crop, quantityKg: kg }] as never);
      const mine = planOrder({ cropType: crop, quantityKg: kg, deliveryDate: inDays(20) });
      expect([mine.baseTrays, mine.bufferTrays, mine.totalTrays]).toEqual([expected.baseTrays, expected.bufferTrays, expected.totalTrays]);
    }
  });

  it("harvests the day before delivery and sows ten days before that", () => {
    const plan = planOrder({ cropType: "sunflower", quantityKg: 1, deliveryDate: inDays(20) });
    expect(daysUntil(plan.harvestDate, NOW)).toBe(19);
    expect(daysUntil(plan.sowDate, NOW)).toBe(9);
  });

  it("uses the crop's own cycle length", () => {
    expect(planOrder({ cropType: "wheatgrass", quantityKg: 1, deliveryDate: inDays(20) }).cycleDays).toBe(10);
  });
});

describe("daysUntil", () => {
  it("counts calendar days, whatever the time of day", () => {
    expect(daysUntil(inDays(0), NOW)).toBe(0);
    expect(daysUntil(inDays(3), NOW)).toBe(3);
    expect(daysUntil(inDays(-2), NOW)).toBe(-2);
    expect(daysUntil(new Date(2026, 10, 16, 0, 5), new Date(2026, 10, 15, 23, 55))).toBe(1);
  });
});

describe("urgencyOf", () => {
  it("is overdue once the delivery date has passed", () => {
    expect(urgencyOf(inDays(-1), NOW)).toEqual({ level: "overdue", days: -1 });
  });
  it("is urgent inside the 11-day window the planner needs", () => {
    expect(urgencyOf(inDays(5), NOW).level).toBe("urgent");
    expect(urgencyOf(inDays(10), NOW).level).toBe("urgent");
  });
  it("relaxes beyond it", () => {
    expect(urgencyOf(inDays(11), NOW).level).toBe("soon");
    expect(urgencyOf(inDays(14), NOW).level).toBe("soon");
    expect(urgencyOf(inDays(15), NOW).level).toBe("ok");
  });
});

describe("sortByUrgency", () => {
  it("puts the nearest delivery first without changing the input", () => {
    const list = [{ deliveryDate: inDays(9) }, { deliveryDate: inDays(2) }, { deliveryDate: inDays(5) }];
    expect(sortByUrgency(list).map((o) => daysUntil(o.deliveryDate, NOW))).toEqual([2, 5, 9]);
    expect(daysUntil(list[0].deliveryDate, NOW)).toBe(9);
  });
});

describe("waitingFor", () => {
  const ago = (hours: number) => new Date(NOW.getTime() - hours * 3600 * 1000);
  it("says how long something has waited", () => {
    expect(waitingFor(ago(0.2), NOW)).toBe("just now");
    expect(waitingFor(ago(1), NOW)).toBe("1 hour ago");
    expect(waitingFor(ago(5), NOW)).toBe("5 hours ago");
    expect(waitingFor(ago(24), NOW)).toBe("1 day ago");
    expect(waitingFor(ago(72), NOW)).toBe("3 days ago");
  });
});
