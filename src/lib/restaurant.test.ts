// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CROP_CYCLE_DAYS } from "@/lib/constants";
import {
  LEAD_BUFFER_DAYS,
  averageRating,
  cartTotal,
  composeFeedbackNotes,
  fromDateInputValue,
  growthProgress,
  minDeliveryDate,
  minDeliveryDays,
  monthlySpend,
  nextDelivery,
  orderFilterOf,
  orderTimeline,
  parseCrop,
  parseFeedbackNotes,
  parseOrderFilter,
  parseOrderSort,
  parseRecurrence,
  searchOrders,
  sortOrders,
  stageIndex,
  toDateInputValue,
} from "./restaurant";

const NOW = new Date(2026, 10, 15, 21, 30); // 15 Nov 2026, 21:30 local

describe("cart and delivery date", () => {
  it("totals each line at the crop's price", () => {
    expect(cartTotal([{ cropType: "sunflower", quantityKg: 1.5 }, { cropType: "radish", quantityKg: 2 }])).toBe(675 + 640);
    expect(cartTotal([])).toBe(0);
  });

  it("lets the slowest crop in the cart set the earliest delivery", () => {
    expect(minDeliveryDays(["radish"])).toBe(CROP_CYCLE_DAYS.radish + LEAD_BUFFER_DAYS);
    expect(minDeliveryDays(["radish", "wheatgrass"])).toBe(CROP_CYCLE_DAYS.wheatgrass + LEAD_BUFFER_DAYS);
  });

  it("matches the production planner, which sows 11 days before delivery, for a sunflower order", () => {
    expect(minDeliveryDays(["sunflower"])).toBe(11);
  });

  it("uses the quickest crop for an empty cart, so the hint is never pessimistic", () => {
    expect(minDeliveryDays([])).toBe(Math.min(...Object.values(CROP_CYCLE_DAYS)) + LEAD_BUFFER_DAYS);
  });

  it("adds the days to the date it is given", () => {
    const date = minDeliveryDate(["sunflower"], NOW);
    expect(date.getDate()).toBe(26);
    expect(date.getMonth()).toBe(10);
  });

  it("writes date inputs in local time, not UTC, so an evening in India is not a day early", () => {
    const lateEvening = new Date(2026, 10, 15, 23, 45);
    expect(toDateInputValue(lateEvening)).toBe("2026-11-15");
  });

  it("round-trips a date input value to local midnight", () => {
    const parsed = fromDateInputValue("2026-12-01");
    expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), parsed.getHours()]).toEqual([2026, 11, 1, 0]);
  });
});

describe("query parsing", () => {
  it("accepts only known recurrences, crops, filters and sorts", () => {
    expect(parseRecurrence("weekly")).toBe("weekly");
    expect(parseRecurrence("daily")).toBeNull();
    expect(parseCrop("radish")).toBe("radish");
    expect(parseCrop("kale")).toBeNull();
    expect(parseCrop(undefined)).toBeNull();
    expect(parseOrderFilter("transit")).toBe("transit");
    expect(parseOrderFilter("nope")).toBe("all");
    expect(parseOrderSort("amount")).toBe("amount");
    expect(parseOrderSort("random")).toBe("newest");
  });
});

describe("stageIndex and orderTimeline", () => {
  const order = (status: string, extra: Record<string, unknown> = {}) => ({ status, createdAt: new Date(2026, 10, 1), ...extra });

  it("is -1 while the order awaits payment", () => {
    expect(stageIndex(order("PENDING_PAYMENT"))).toBe(-1);
  });

  it("follows the order status, and lets the delivery record be ahead but never behind", () => {
    expect(stageIndex(order("CONFIRMED"))).toBe(0);
    expect(stageIndex(order("IN_PRODUCTION"))).toBe(1);
    expect(stageIndex(order("IN_PRODUCTION", { delivery: { status: "IN_TRANSIT" } }))).toBe(3);
    expect(stageIndex(order("IN_TRANSIT", { delivery: { status: "PACKED" } }))).toBe(3);
  });

  it("shows a full tracker even before a delivery record exists (the old bar was empty)", () => {
    const steps = orderTimeline(order("IN_PRODUCTION"));
    expect(steps.map((s) => s.title)).toEqual(["Confirmed", "In production", "At hub", "In transit", "Delivered"]);
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
  });

  it("waits on the first step while payment is pending", () => {
    expect(orderTimeline(order("PENDING_PAYMENT")).map((s) => s.state)).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
  });

  it("completes every step on delivery, with timestamps for the steps reached", () => {
    const packed = new Date(2026, 10, 10);
    const sent = new Date(2026, 10, 11);
    const done = new Date(2026, 10, 12);
    const steps = orderTimeline(order("DELIVERED", { delivery: { status: "DELIVERED", packedAt: packed, dispatchedAt: sent, deliveredAt: done }, productionPlan: { sowDate: new Date(2026, 10, 2) } }));
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(steps[2].at).toEqual(packed);
    expect(steps[3].at).toEqual(sent);
    expect(steps[4].at).toEqual(done);
  });

  it("shows no timestamp for a step not reached yet", () => {
    const steps = orderTimeline(order("CONFIRMED", { delivery: { status: "DELIVERED", packedAt: null, dispatchedAt: null, deliveredAt: new Date() } }));
    expect(steps[4].at).not.toBeNull(); // the delivery record says delivered, so it was reached
    const early = orderTimeline(order("CONFIRMED"));
    expect(early[2].at).toBeNull();
  });
});

describe("growthProgress", () => {
  const plan = (days: number[]) => ({ tasks: [{ batches: days.map((d) => ({ currentDay: d })) }] });

  it("is not started before production", () => {
    expect(growthProgress({ status: "CONFIRMED", cropType: "sunflower" })).toEqual({ percent: 0, day: 0, totalDays: 9 });
  });

  it("reads the furthest tray while it grows, against the crop's own cycle", () => {
    expect(growthProgress({ status: "IN_PRODUCTION", cropType: "sunflower", productionPlan: plan([2, 4, 3]) })).toEqual({ percent: 44, day: 4, totalDays: 9 });
    expect(growthProgress({ status: "IN_PRODUCTION", cropType: "wheatgrass", productionPlan: plan([5]) }).totalDays).toBe(10);
  });

  it("is zero days when no tray has checked in yet", () => {
    expect(growthProgress({ status: "IN_PRODUCTION", cropType: "radish", productionPlan: plan([]) }).percent).toBe(0);
  });

  it("is fully grown once it is at the hub or beyond", () => {
    expect(growthProgress({ status: "AT_HUB", cropType: "radish" }).percent).toBe(100);
    expect(growthProgress({ status: "DELIVERED", cropType: "radish" })).toEqual({ percent: 100, day: 7, totalDays: 7 });
  });
});

describe("order lists", () => {
  const orders = [
    { id: "aaaa1111zzz", cropType: "radish", status: "DELIVERED", quantityKg: 2, totalPrice: 640, createdAt: new Date(2026, 9, 1) },
    { id: "bbbb2222zzz", cropType: "sunflower", status: "PENDING_PAYMENT", quantityKg: 1, totalPrice: 450, createdAt: new Date(2026, 10, 1) },
    { id: "cccc3333zzz", cropType: "mustard", status: "IN_TRANSIT", quantityKg: 5, totalPrice: 1750, createdAt: new Date(2026, 9, 20) },
  ];
  const name = (crop: string) => ({ radish: "Radish", sunflower: "Sunflower Shoots", mustard: "Mustard" })[crop] ?? crop;

  it("groups every status into one filter", () => {
    expect(["PENDING_PAYMENT", "CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT", "DELIVERED", "CANCELLED"].map(orderFilterOf)).toEqual([
      "awaiting", "production", "production", "transit", "transit", "delivered", "cancelled",
    ]);
  });

  it("searches by the short id or the crop name, ignoring case", () => {
    expect(searchOrders(orders, "BBBB", name).map((o) => o.id)).toEqual(["bbbb2222zzz"]);
    expect(searchOrders(orders, "must", name).map((o) => o.id)).toEqual(["cccc3333zzz"]);
    expect(searchOrders(orders, "  ", name)).toHaveLength(3);
    expect(searchOrders(orders, "zzzz", name)).toHaveLength(0);
  });

  it("sorts newest, oldest or by amount, without changing the input", () => {
    expect(sortOrders(orders, "newest").map((o) => o.id)).toEqual(["bbbb2222zzz", "cccc3333zzz", "aaaa1111zzz"]);
    expect(sortOrders(orders, "oldest").map((o) => o.id)).toEqual(["aaaa1111zzz", "cccc3333zzz", "bbbb2222zzz"]);
    expect(sortOrders(orders, "amount").map((o) => o.id)).toEqual(["cccc3333zzz", "aaaa1111zzz", "bbbb2222zzz"]);
    expect(orders[0].id).toBe("aaaa1111zzz");
  });
});

describe("monthlySpend", () => {
  const o = (y: number, m: number, d: number, totalPrice: number, status = "CONFIRMED") => ({ createdAt: new Date(y, m, d), totalPrice, status });

  it("compares this month with last month over every order", () => {
    const result = monthlySpend([o(2026, 10, 2, 600), o(2026, 10, 9, 400), o(2026, 9, 20, 500), o(2026, 8, 1, 9999)], NOW);
    expect(result).toEqual({ thisMonth: 1000, lastMonth: 500, change: 100 });
  });

  it("does not count cancelled orders as spend", () => {
    expect(monthlySpend([o(2026, 10, 2, 600), o(2026, 10, 3, 300, "CANCELLED")], NOW).thisMonth).toBe(600);
  });

  it("has no percentage when last month had no spend, instead of inventing one", () => {
    expect(monthlySpend([o(2026, 10, 2, 600)], NOW).change).toBeNull();
  });

  it("handles January, whose previous month is last December", () => {
    const jan = new Date(2027, 0, 10);
    expect(monthlySpend([o(2026, 11, 5, 200), o(2027, 0, 2, 300)], jan)).toEqual({ thisMonth: 300, lastMonth: 200, change: 50 });
  });
});

describe("averageRating and nextDelivery", () => {
  it("rounds to one decimal and is null with no ratings", () => {
    expect(averageRating([5, 4, 4])).toBe(4.3);
    expect(averageRating([])).toBeNull();
  });

  it("picks the soonest upcoming delivery of an order that is on its way", () => {
    const list = [
      { status: "DELIVERED", deliveryDate: new Date(2026, 10, 20) },
      { status: "IN_PRODUCTION", deliveryDate: new Date(2026, 10, 25) },
      { status: "CONFIRMED", deliveryDate: new Date(2026, 10, 18) },
      { status: "IN_TRANSIT", deliveryDate: new Date(2026, 10, 10) }, // already past
    ];
    expect(nextDelivery(list, NOW)).toBe(list[2]);
    expect(nextDelivery([], NOW)).toBeNull();
  });

  it("counts today's delivery as still ahead", () => {
    const today = { status: "IN_TRANSIT", deliveryDate: new Date(2026, 10, 15) };
    expect(nextDelivery([today], NOW)).toBe(today);
  });
});

describe("feedback tags", () => {
  it("puts the chosen tags on the first line of the notes", () => {
    expect(composeFeedbackNotes(["Freshness", "Quality"], " Lovely crop ")).toBe("Tags: Quality, Freshness\nLovely crop");
  });

  it("ignores tags it does not know and stores nothing for an empty form", () => {
    expect(composeFeedbackNotes(["Hacked"], "")).toBe("");
    expect(composeFeedbackNotes([], "Only text")).toBe("Only text");
    expect(composeFeedbackNotes(["On time"], "")).toBe("Tags: On time");
  });

  it("reads them back, and treats notes without the prefix as plain text", () => {
    expect(parseFeedbackNotes("Tags: Quality, Packaging\nBox was dented")).toEqual({ tags: ["Quality", "Packaging"], text: "Box was dented" });
    expect(parseFeedbackNotes("Just a note")).toEqual({ tags: [], text: "Just a note" });
    expect(parseFeedbackNotes(null)).toEqual({ tags: [], text: "" });
  });

  it("round-trips", () => {
    const stored = composeFeedbackNotes(["Freshness", "On time"], "Great");
    expect(parseFeedbackNotes(stored)).toEqual({ tags: ["Freshness", "On time"], text: "Great" });
  });
});
