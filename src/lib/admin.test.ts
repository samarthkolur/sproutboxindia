// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// lib/business pulls in Prisma; only its pure maths is compared here.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { calculateProductionPlan } from "@/lib/business";
import { checkAllocation, commission, composeQcNotes, fssaiKind, growerMatches, isLate, kpiVerdict, parseDeliveryFilter, parseGrowerFilter, parsePayoutFilter, parseRestaurantFilter, payoutFilterOf, restaurantActivity, scorePercent, daysUntil, decisionError, decisionForKey, nextIndex, haversineKm, pipelineSentence, proposeAllocation, scoreCandidates, type GrowerInput, planOrder, qcPassPercent, sortByUrgency, urgencyOf, waitingFor, weeklyTotals } from "./admin";

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

describe("weeklyTotals", () => {
  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);

  it("sums each real 7-day window, oldest first, the last ending now", () => {
    const rows = [
      { at: daysAgo(1), value: 5 },
      { at: daysAgo(6), value: 3 },
      { at: daysAgo(9), value: 4 },
      { at: daysAgo(40), value: 99 },
      { at: null, value: 7 },
    ];
    expect(weeklyTotals(rows, NOW, 4).map((w) => w.value)).toEqual([0, 0, 4, 8]);
  });

  it("returns one labelled window per week asked for", () => {
    const weeks = weeklyTotals([], NOW, 8);
    expect(weeks).toHaveLength(8);
    expect(weeks[7].label).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/);
  });
});

describe("pipelineSentence", () => {
  const none = { demand: 0, allocate: 0, dispatch: 0, qc: 0, payout: 0 };
  it("says nothing is waiting when the pipeline is empty", () => {
    expect(pipelineSentence(none)).toMatch(/up to date/);
  });
  it("lists what is waiting, in pipeline order", () => {
    expect(pipelineSentence({ ...none, demand: 5, qc: 1 })).toBe("5 orders need a plan, 1 tray is waiting for QC.");
    expect(pipelineSentence({ ...none, allocate: 1, dispatch: 2, payout: 3 })).toBe("1 plan needs growers, 2 tasks are waiting for supplies, 3 payouts are pending.");
  });
});

describe("qcPassPercent", () => {
  it("is a whole percent of the reviewed trays, and null before any review", () => {
    expect(qcPassPercent(37, 42)).toBe(88);
    expect(qcPassPercent(0, 0)).toBeNull();
    expect(qcPassPercent(0, 5)).toBe(0);
  });
});

describe("haversineKm", () => {
  it("is about 1.4 km between two Koramangala points and zero for the same one", () => {
    expect(haversineKm(12.9352, 77.6245, 12.9352, 77.6245)).toBe(0);
    expect(haversineKm(12.9345, 77.6193, 12.9352, 77.6245)).toBeGreaterThan(0.4);
    expect(haversineKm(12.9345, 77.6193, 12.9352, 77.6245)).toBeLessThan(1);
  });
});

const grower = (id: string, over: Partial<GrowerInput> = {}): GrowerInput => ({
  id, name: id, city: "Bengaluru", kitSize: 15, activeTrays: 0, compositeScore: 0.8, lat: 12.9352, lng: 77.6245, fssaiVerified: false, ...over,
});
const restaurant = { lat: 12.9345, lng: 77.6193 };

describe("scoreCandidates", () => {
  it("ranks a close, well-scored grower above a distant or weak one", () => {
    const ranked = scoreCandidates([grower("far", { lat: 13.2, lng: 77.9 }), grower("weak", { compositeScore: 0.3 }), grower("best")], restaurant);
    expect(ranked.map((c) => c.id)).toEqual(["best", "weak", "far"]);
  });

  it("measures room in trays, not tasks, and never below zero", () => {
    const ranked = scoreCandidates([grower("a", { kitSize: 15, activeTrays: 12 }), grower("b", { kitSize: 5, activeTrays: 9 })], restaurant);
    expect(Object.fromEntries(ranked.map((c) => [c.id, c.free]))).toEqual({ a: 3, b: 0 });
  });

  it("treats a missing location as middling, not as a failure", () => {
    const [c] = scoreCandidates([grower("nogps", { lat: null, lng: null })], restaurant);
    expect(c.distanceKm).toBeNull();
    expect(c.combined).toBeCloseTo(0.3 * 0.5 + 0.8 * 0.5);
  });
});

describe("proposeAllocation", () => {
  const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

  it("splits the trays in proportion to score and always totals the plan", () => {
    const candidates = scoreCandidates([grower("a", { compositeScore: 0.9 }), grower("b", { compositeScore: 0.6 }), grower("c", { compositeScore: 0.3 })], restaurant);
    const split = proposeAllocation(candidates, 19);
    expect(sum(split)).toBe(19);
    expect(split.a).toBeGreaterThan(split.b);
    expect(split.b).toBeGreaterThan(split.c);
  });

  it("never gives a grower more than they have room for", () => {
    const candidates = scoreCandidates([grower("small", { kitSize: 5, compositeScore: 0.95 }), grower("big", { kitSize: 40, compositeScore: 0.5 })], restaurant);
    const split = proposeAllocation(candidates, 19);
    expect(split.small).toBeLessThanOrEqual(5);
    expect(sum(split)).toBe(19);
  });

  it("skips a grower who is full", () => {
    const candidates = scoreCandidates([grower("full", { kitSize: 5, activeTrays: 5 }), grower("open")], restaurant);
    expect(proposeAllocation(candidates, 8)).toEqual({ full: 0, open: 8 });
  });

  it("leaves trays unassigned when there is not enough room, rather than overfilling", () => {
    const candidates = scoreCandidates([grower("a", { kitSize: 5 }), grower("b", { kitSize: 5 })], restaurant);
    const split = proposeAllocation(candidates, 23);
    expect(sum(split)).toBe(10);
    expect(Object.values(split).every((n) => n <= 5)).toBe(true);
  });

  it("hands out a handful of trays one by one, best grower first", () => {
    const candidates = scoreCandidates([grower("a", { compositeScore: 0.9 }), grower("b", { compositeScore: 0.8 }), grower("c", { compositeScore: 0.7 })], restaurant);
    expect(sum(proposeAllocation(candidates, 2))).toBe(2);
  });

  it("is empty with nobody to give to", () => {
    expect(proposeAllocation([], 10)).toEqual({});
  });
});

describe("checkAllocation", () => {
  const candidates = scoreCandidates([grower("a", { kitSize: 10 }), grower("b", { kitSize: 5 })], restaurant);

  it("is sendable only when the trays add up exactly and nobody is over capacity", () => {
    expect(checkAllocation({ a: 8, b: 5 }, candidates, 13)).toEqual({ assigned: 13, remaining: 0, overCapacity: [], ok: true });
  });

  it("reports what is still unassigned", () => {
    expect(checkAllocation({ a: 8 }, candidates, 13)).toMatchObject({ remaining: 5, ok: false });
  });

  it("names anyone given more than they have room for", () => {
    const result = checkAllocation({ a: 8, b: 9 }, candidates, 17);
    expect(result.overCapacity).toEqual(["b"]);
    expect(result.ok).toBe(false);
  });

  it("will not send more trays than the plan needs", () => {
    expect(checkAllocation({ a: 10, b: 5 }, candidates, 13).ok).toBe(false);
  });
});

describe("QC notes and decisions", () => {
  it("puts the chosen reasons first, then what was typed", () => {
    expect(composeQcNotes(["Pale or yellow stems", "Mould or fungus"], "Left edge")).toBe("Mould or fungus, Pale or yellow stems. Left edge");
    expect(composeQcNotes(["Too short"], "")).toBe("Too short");
    expect(composeQcNotes([], "  Only text ")).toBe("Only text");
    expect(composeQcNotes(["Made up"], "")).toBe("");
  });

  it("requires a reason to reject, and nothing else", () => {
    expect(decisionError("REJECT", "")).toMatch(/reason/);
    expect(decisionError("REJECT", "  ")).toMatch(/reason/);
    expect(decisionError("REJECT", "Mould")).toBeNull();
    expect(decisionError("PASS", "")).toBeNull();
    expect(decisionError("RISK", "")).toBeNull();
  });

  it("maps P, R and X to the decisions, in either case", () => {
    expect([decisionForKey("p"), decisionForKey("R"), decisionForKey("x"), decisionForKey("z")]).toEqual(["PASS", "RISK", "REJECT", null]);
  });

  it("steps through the queue and wraps round", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 3, -1)).toBe(2);
    expect(nextIndex(0, 0)).toBe(-1);
  });
});

describe("growers", () => {
  const g = (over: Record<string, unknown> = {}) => ({ fssaiRegNumber: null as string | null, fssaiVerifiedAt: null as Date | null, isActive: true, ...over });

  it("classifies FSSAI as verified, pending or missing", () => {
    expect(fssaiKind(g({ fssaiRegNumber: "123", fssaiVerifiedAt: NOW }))).toBe("verified");
    expect(fssaiKind(g({ fssaiRegNumber: "123" }))).toBe("pending");
    expect(fssaiKind(g())).toBe("missing");
  });

  it("filters by compliance, and by account status separately", () => {
    expect(growerMatches(g({ fssaiRegNumber: "1" }), "pending")).toBe(true);
    expect(growerMatches(g({ fssaiRegNumber: "1" }), "missing")).toBe(false);
    expect(growerMatches(g({ isActive: false }), "inactive")).toBe(true);
    expect(growerMatches(g({ isActive: false }), "missing")).toBe(true); // overlaps on purpose
    expect(growerMatches(g(), "inactive")).toBe(false);
    expect(growerMatches(g(), "all")).toBe(true);
  });

  it("parses the filter from the URL, falling back to all", () => {
    expect(parseGrowerFilter("pending")).toBe("pending");
    expect(parseGrowerFilter("nonsense")).toBe("all");
    expect(parseGrowerFilter(undefined)).toBe("all");
  });

  it("shows a score only once a tray has finished", () => {
    expect(scorePercent(0.5, 0)).toBeNull();
    expect(scorePercent(0.94, 3)).toBe(94);
  });
});

describe("restaurantActivity", () => {
  it("is never, dormant after 30 days without an order, or active", () => {
    expect(restaurantActivity(null, NOW)).toBe("never");
    expect(restaurantActivity(inDays(-10), NOW)).toBe("active");
    expect(restaurantActivity(inDays(-30), NOW)).toBe("active");
    expect(restaurantActivity(inDays(-31), NOW)).toBe("dormant");
  });
  it("parses the filter", () => {
    expect(parseRestaurantFilter("dormant")).toBe("dormant");
    expect(parseRestaurantFilter("x")).toBe("all");
  });
});

describe("isLate", () => {
  const promised = new Date(2026, 9, 25);
  it("counts a delivery any time on the promised day as on time", () => {
    expect(isLate({ status: "DELIVERED", deliveredAt: new Date(2026, 9, 25, 23, 50) }, promised, NOW)).toBe(false);
    expect(isLate({ status: "DELIVERED", deliveredAt: new Date(2026, 9, 26, 0, 10) }, promised, NOW)).toBe(true);
  });
  it("is late when the day has passed and it has not arrived", () => {
    expect(isLate({ status: "IN_TRANSIT", deliveredAt: null }, new Date(2026, 10, 10), NOW)).toBe(true);
    expect(isLate({ status: "PACKED", deliveredAt: null }, new Date(2026, 10, 20), NOW)).toBe(false);
  });
  it("does not call a failed delivery late: it is failed", () => {
    expect(isLate({ status: "FAILED", deliveredAt: null }, new Date(2026, 10, 1), NOW)).toBe(false);
  });
  it("parses the delivery filter", () => {
    expect(parseDeliveryFilter("IN_TRANSIT")).toBe("IN_TRANSIT");
    expect(parseDeliveryFilter("lost")).toBe("all");
  });
});

describe("payouts, money and KPIs", () => {
  it("files processing under pending, and opens on pending", () => {
    expect(["PENDING", "PROCESSING", "PAID", "FAILED"].map(payoutFilterOf)).toEqual(["pending", "pending", "paid", "failed"]);
    expect(parsePayoutFilter(undefined)).toBe("pending");
    expect(parsePayoutFilter("paid")).toBe("paid");
  });

  it("keeps revenue minus payouts as the commission, with a percentage", () => {
    expect(commission(2680, 1850)).toEqual({ kept: 830, percent: 31 });
    expect(commission(0, 0)).toEqual({ kept: 0, percent: null });
  });

  it("judges a KPI against its target, either way round, with no data as its own state", () => {
    expect(kpiVerdict(0.96, 0.95)).toBe("met");
    expect(kpiVerdict(0.9, 0.95)).toBe("below");
    expect(kpiVerdict(0.02, 0.03, true)).toBe("met");
    expect(kpiVerdict(0.05, 0.03, true)).toBe("below");
    expect(kpiVerdict(null, 0.95)).toBe("nodata");
  });
});
