// @vitest-environment node
import { describe, expect, it } from "vitest";
import { KPI_TARGETS, kpiCards, type KpiSnapshot } from "./kpi";

const snapshot = (over: Partial<KpiSnapshot> = {}): KpiSnapshot => ({
  kgDeliveredPerWeek: { value: 320, weeks: [100, 200, 320] },
  qcPassRate: { value: 0.96, sampleSize: 42 },
  onTimeDeliveryRate: { value: 0.9, sampleSize: 12 },
  activeCertifiedGrowers: { value: 14 },
  growerAcceptanceRate: { value: null, note: "Not trackable yet." },
  mrr: { value: 10465 },
  restaurantChurnRate: { value: 0.02, cohortSize: 5 },
  ...over,
});
const card = (key: string, over: Partial<KpiSnapshot> = {}) => kpiCards(snapshot(over)).find((c) => c.key === key)!;

describe("kpiCards", () => {
  it("has the seven KPIs of the measurement framework", () => {
    expect(kpiCards(snapshot()).map((c) => c.key)).toEqual(["kg", "qc", "ontime", "growers", "acceptance", "mrr", "churn"]);
  });

  it("judges each against its target: met, below, or no data", () => {
    expect(card("qc").verdict).toBe("met");
    expect(card("ontime").verdict).toBe("below");
    expect(card("growers").verdict).toBe("below");
    expect(card("acceptance").verdict).toBe("nodata");
  });

  it("treats churn the other way round: lower is better", () => {
    expect(card("churn").verdict).toBe("met");
    expect(card("churn", { restaurantChurnRate: { value: 0.08, cohortSize: 5 } }).verdict).toBe("below");
  });

  it("says no data, not 0% or 100%, when there is nothing to measure", () => {
    const qc = card("qc", { qcPassRate: { value: null, sampleSize: 0 } });
    expect(qc).toMatchObject({ value: "—", verdict: "nodata", progress: null });
    expect(qc.caption).toMatch(/No check-ins/);
  });

  it("gives progress towards the target, capped at full", () => {
    expect(card("kg").progress).toBe(1);
    expect(card("growers").progress).toBeCloseTo(14 / 150);
  });

  it("only offers a trend where one exists", () => {
    expect(card("kg").series).toEqual([100, 200, 320]);
    expect(card("kg", { kgDeliveredPerWeek: { value: 5, weeks: [5] } }).series).toBeUndefined();
    expect(card("qc").series).toBeUndefined();
  });

  it("takes its targets from one place", () => {
    expect(card("kg").target).toBe(`Target ${KPI_TARGETS.kgPerWeek} kg`);
    expect(card("mrr").target).toBe("Target ₹5,40,000");
  });

  it("explains how each is computed, and what is only a stand-in", () => {
    expect(card("growers").definition).toMatch(/stand-in/);
    expect(card("mrr").definition).toMatch(/stand-in/);
    expect(card("acceptance").definition).toBe("Not trackable yet.");
  });
});
