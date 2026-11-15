// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, db } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    auth: vi.fn(),
    db: {
      order: { findUnique: fn(), update: fn() },
      productionPlan: { create: fn() },
      checkIn: { findUnique: fn(), update: fn() },
      batch: { update: fn() },
      notification: { create: fn(), createMany: fn() },
      payout: { findUnique: fn(), update: fn(), updateMany: fn() },
      task: { findMany: fn(), updateMany: fn(), update: fn() },
      grower: { findUnique: fn(), update: fn() },
      $transaction: fn(),
    } as Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  };
});
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/business", () => ({ updateGrowerScores: vi.fn() }));

import { createProductionPlan, createProductionPlans } from "@/actions/demand.actions";
import { markGrowerSuppliesDelivered } from "@/actions/dispatch.actions";
import { setGrowerActive } from "@/actions/grower.actions";
import { markPayoutAsPaid, markPayoutsAsPaid } from "@/actions/payout.actions";
import { processQCCheckIn } from "@/actions/qc.actions";
import { getGrowerLeaderboard, updateGrowerScoresAction } from "@/actions/admin.actions";

const asAdmin = () => auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
const touchedDb = () => Object.values(db).some((model) => Object.values(model as Record<string, { mock?: { calls: unknown[] } }>).some((fn) => (fn as { mock?: { calls: unknown[] } })?.mock?.calls?.length));

beforeEach(() => {
  auth.mockReset();
  for (const model of Object.values(db)) {
    if (typeof model === "function") model.mockReset();
    else for (const fn of Object.values(model)) fn.mockReset();
  }
});

describe("admin actions refuse everyone but an admin", () => {
  const callers: [string, () => Promise<unknown>][] = [
    ["createProductionPlan", () => createProductionPlan("o1")],
    ["createProductionPlans", () => createProductionPlans(["o1"])],
    ["processQCCheckIn", () => processQCCheckIn("c1", "PASS")],
    ["markPayoutAsPaid", () => markPayoutAsPaid("p1")],
    ["markPayoutsAsPaid", () => markPayoutsAsPaid(["p1"])],
    ["markGrowerSuppliesDelivered", () => markGrowerSuppliesDelivered("g1")],
    ["setGrowerActive", () => setGrowerActive("g1", false)],
    ["updateGrowerScoresAction", () => updateGrowerScoresAction("g1")],
    ["getGrowerLeaderboard", () => getGrowerLeaderboard()],
  ];

  for (const role of [null, "GROWER", "RESTAURANT"]) {
    it.each(callers)(`${role ?? "signed-out"}: %s does nothing`, async (_name, call) => {
      auth.mockResolvedValue(role ? { user: { id: "u", role } } : null);
      const result = await call();
      expect(touchedDb()).toBe(false);
      expect(JSON.stringify(result ?? [])).toMatch(/Unauthorized|\[\]|null/);
    });
  }
});

describe("createProductionPlan", () => {
  it("stores the same plan planOrder previews", async () => {
    asAdmin();
    db.order.findUnique.mockResolvedValue({ id: "o1", status: "CONFIRMED", cropType: "sunflower", quantityKg: 3, deliveryDate: new Date(2026, 11, 20) });
    db.$transaction.mockResolvedValue([]);
    const result = await createProductionPlan("o1");
    expect(result).toEqual({ success: true });
    expect(db.productionPlan.create.mock.calls[0][0].data).toMatchObject({ orderId: "o1", totalKg: 3, totalTrays: 19, bufferTrays: 4, status: "DRAFT" });
  });

  it("refuses an order that is not confirmed", async () => {
    asAdmin();
    db.order.findUnique.mockResolvedValue({ id: "o1", status: "PENDING_PAYMENT" });
    expect(await createProductionPlan("o1")).toEqual({ error: "Order must be CONFIRMED to create a production plan" });
  });

  it("bulk create reports how many were made and which failed", async () => {
    asAdmin();
    db.order.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === "bad" ? { id: "bad", status: "CANCELLED" } : { id: where.id, status: "CONFIRMED", cropType: "radish", quantityKg: 1, deliveryDate: new Date(2026, 11, 20) }
    );
    db.$transaction.mockResolvedValue([]);
    const result = await createProductionPlans(["a", "bad", "b"]);
    expect(result.created).toBe(2);
    expect(result.failed).toEqual([{ orderId: "bad", error: "Order must be CONFIRMED to create a production plan" }]);
  });
});

describe("processQCCheckIn", () => {
  const checkIn = (batchStatus: string) => ({ id: "c1", batch: { id: "b1", taskId: "t1", trayNumber: 4, status: batchStatus, task: { grower: { userId: "gu1" } } } });

  it("passes a tray, records who reviewed it and tells the grower", async () => {
    asAdmin();
    db.checkIn.findUnique.mockResolvedValue(checkIn("QC_PENDING"));
    expect(await processQCCheckIn("c1", "PASS")).toEqual({ success: true });
    expect(db.checkIn.update.mock.calls[0][0].data).toMatchObject({ qcResult: "PASS", qcReviewedBy: "admin-1" });
    expect(db.batch.update.mock.calls[0][0].data).toEqual({ status: "QC_PASSED" });
    expect(db.notification.create).toHaveBeenCalled();
  });

  it("sends the reviewer's reason to the grower on a reject", async () => {
    asAdmin();
    db.checkIn.findUnique.mockResolvedValue(checkIn("QC_PENDING"));
    await processQCCheckIn("c1", "REJECT", "Mould on the left edge");
    expect(db.checkIn.update.mock.calls[0][0].data.qcNotes).toBe("Mould on the left edge");
    expect(db.notification.create.mock.calls[0][0].data.message).toContain("Mould on the left edge");
  });

  it("will not pass or reject a tray that has already been reviewed", async () => {
    asAdmin();
    db.checkIn.findUnique.mockResolvedValue(checkIn("HARVESTED"));
    expect(await processQCCheckIn("c1", "PASS")).toEqual({ error: "This tray has already been reviewed" });
    expect(db.batch.update).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("lets a risk flag be recorded without changing the tray", async () => {
    asAdmin();
    db.checkIn.findUnique.mockResolvedValue(checkIn("QC_PENDING"));
    await processQCCheckIn("c1", "RISK", "Slightly pale");
    expect(db.batch.update).not.toHaveBeenCalled();
    expect(db.checkIn.update.mock.calls[0][0].data.qcResult).toBe("RISK");
  });
});

describe("payouts, supplies and growers", () => {
  it("pays several payouts at once, only those still unpaid", async () => {
    asAdmin();
    db.payout.updateMany.mockResolvedValue({ count: 2 });
    expect(await markPayoutsAsPaid(["a", "b", "c"])).toEqual({ count: 2 });
    const args = db.payout.updateMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: { in: ["a", "b", "c"] }, status: { in: ["PENDING", "PROCESSING"] } });
    expect(args.data.status).toBe("PAID");
    expect(args.data.paidAt).toBeInstanceOf(Date);
  });

  it("does not run an empty bulk payment", async () => {
    asAdmin();
    expect(await markPayoutsAsPaid([])).toEqual({ count: 0 });
    expect(db.payout.updateMany).not.toHaveBeenCalled();
  });

  it("marks all of one grower's waiting tasks delivered and notifies once per task", async () => {
    asAdmin();
    db.task.findMany.mockResolvedValue([
      { id: "t1", trayCount: 5, cropType: "radish", grower: { userId: "gu1" } },
      { id: "t2", trayCount: 3, cropType: "mustard", grower: { userId: "gu1" } },
    ]);
    db.$transaction.mockResolvedValue([]);
    expect(await markGrowerSuppliesDelivered("g1")).toEqual({ count: 2 });
    expect(db.task.findMany.mock.calls[0][0].where).toEqual({ growerId: "g1", status: "ASSIGNED" });
    expect(db.notification.createMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it("pauses and resumes a grower", async () => {
    asAdmin();
    db.grower.findUnique.mockResolvedValue({ id: "g1" });
    expect(await setGrowerActive("g1", false)).toEqual({ success: true });
    expect(db.grower.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { isActive: false } });
  });
});
