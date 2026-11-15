// @vitest-environment node
import { describe, expect, it } from "vitest";
import { growerStatement, inr, isInvoiceable, maskUpi, restaurantInvoice, settlementStatement } from "./invoices";

const created = new Date(2026, 9, 13, 11, 20);
const order = { id: "cmabc12345xyz", cropType: "sunflower", quantityKg: 3, totalPrice: 1350, status: "DELIVERED", createdAt: created, deliveryDate: new Date(2026, 9, 25) };
const restaurant = { businessName: "The Green Bowl", contactName: "Arjun Mehta", address: "14, 80 Feet Road", city: "Bengaluru", pincode: "560095", phone: "9000000021", gstin: null };

describe("inr", () => {
  it("writes rupees with Indian grouping and two decimals, without the rupee sign the PDF fonts lack", () => {
    expect(inr(1350)).toBe("Rs. 1,350.00");
    expect(inr(1234567.5)).toBe("Rs. 12,34,567.50");
    expect(inr(0)).toBe("Rs. 0.00");
  });
});

describe("maskUpi", () => {
  it("keeps the last four of the id and the handle", () => {
    expect(maskUpi("9000000001@ybl")).toBe("••••••0001@ybl");
  });
  it("hides a malformed value completely", () => {
    expect(maskUpi("nonsense")).toBe("••••");
  });
});

describe("restaurantInvoice", () => {
  const doc = restaurantInvoice({ order, restaurant, deliveredAt: new Date(2026, 9, 25, 10, 40) });

  it("bills the crop at its rate and totals to the order amount", () => {
    expect(doc.rows).toHaveLength(1);
    expect(doc.rows[0]).toMatchObject({ description: "Sunflower Shoots", quantity: "3 kg", rate: "Rs. 450.00 / kg", amount: 1350 });
    expect(doc.totals.find((t) => t.strong)?.amount).toBe(1350);
    expect(doc.totals.find((t) => t.label === "Balance due")?.amount).toBe(0);
  });

  it("has a stable number built from the order date and reference", () => {
    expect(doc.number).toBe("SB-INV-20261013-CMABC123");
    expect(doc.fileName).toBe("SB-INV-20261013-CMABC123.pdf");
    expect(doc.meta.find((m) => m.label === "Delivered on")?.value).toBe("25 Oct 2026");
  });

  it("names the restaurant and leaves out a GSTIN it does not have", () => {
    expect(doc.to.name).toBe("The Green Bowl");
    expect(doc.to.lines.join("\n")).not.toMatch(/GSTIN/);
    expect(restaurantInvoice({ order, restaurant: { ...restaurant, gstin: "ABC" }, deliveredAt: null }).to.lines.join("\n")).toMatch(/GSTIN: ABC/);
  });

  it("is marked paid", () => {
    expect(doc.status).toEqual({ label: "PAID", paid: true });
  });

  it("refuses an order that has not been paid or was cancelled", () => {
    expect(isInvoiceable("PENDING_PAYMENT")).toBe(false);
    expect(isInvoiceable("CANCELLED")).toBe(false);
    expect(isInvoiceable("IN_PRODUCTION")).toBe(true);
    expect(() => restaurantInvoice({ order: { ...order, status: "PENDING_PAYMENT" }, restaurant, deliveredAt: null })).toThrow(/not been paid/);
  });
});

describe("growerStatement", () => {
  const paidOn = new Date(2026, 9, 28, 16, 0);
  const batch = (status: string, paid = true) => ({
    status,
    harvestedAt: status === "HARVESTED" ? new Date(2026, 9, 23, 9, 15) : null,
    payout: status === "HARVESTED" ? { amount: 50, status: paid ? "PAID" : "PENDING", paidAt: paid ? paidOn : null, createdAt: new Date(2026, 9, 23) } : null,
  });
  const input = (batches: ReturnType<typeof batch>[]) => ({
    task: { id: "cmtask0001zzz", cropType: "sunflower", trayCount: batches.length, sowDate: new Date(2026, 9, 14), harvestDate: new Date(2026, 9, 24), orderId: order.id },
    grower: { name: "Suresh Gowda", address: "112, 14th Main", city: "Bengaluru", pincode: "560102", phone: "9000000002", upiId: "9000000002@ybl" },
    batches,
  });

  it("pays 50 a harvested tray and nothing for a rejected one", () => {
    const doc = growerStatement(input([...Array(6).fill(0).map(() => batch("HARVESTED")), batch("REJECTED")]));
    expect(doc.rows[0]).toMatchObject({ quantity: "6 trays", amount: 300 });
    expect(doc.rows[1]).toMatchObject({ description: "Trays not accepted", quantity: "1 tray", amount: 0 });
    expect(doc.totals.map((t) => t.amount)).toEqual([300, 300, 0]);
  });

  it("row amounts add up to the total earned", () => {
    const doc = growerStatement(input(Array(8).fill(0).map(() => batch("HARVESTED"))));
    expect(doc.rows.reduce((s, r) => s + r.amount, 0)).toBe(doc.totals[0].amount);
  });

  it("is dated the day it was paid, and shows the UPI id masked", () => {
    const doc = growerStatement(input([batch("HARVESTED")]));
    expect(doc.status.paid).toBe(true);
    expect(doc.number).toBe("SB-PAY-20261028-CMTASK00");
    expect(doc.meta.find((m) => m.label === "Paid on")?.value).toBe("28 Oct 2026");
    expect(doc.to.lines.join(" ")).toContain("••••••0002@ybl");
    expect(doc.to.lines.join(" ")).not.toContain("9000000002@ybl");
  });

  it("reports what is still pending", () => {
    const doc = growerStatement(input([batch("HARVESTED"), batch("HARVESTED", false)]));
    expect(doc.status).toEqual({ label: "PENDING", paid: false });
    expect(doc.totals.map((t) => [t.label, t.amount])).toEqual([["Total earned", 100], ["Paid", 50], ["Pending", 50]]);
  });

  it("has nothing to say before any payout exists", () => {
    expect(() => growerStatement(input([batch("GROWING")]))).toThrow(/no payout/);
  });
});

describe("settlementStatement", () => {
  const growers = [
    { name: "Lakshmi Venkatesh", trays: 8, rejected: 0, payout: 400, paid: true },
    { name: "Suresh Gowda", trays: 6, rejected: 1, payout: 300, paid: true },
    { name: "Anitha Reddy", trays: 3, rejected: 1, payout: 150, paid: true },
  ];
  const doc = settlementStatement({ order, restaurantName: "The Green Bowl", deliveredAt: new Date(2026, 9, 25), growers });

  it("splits the order: what the restaurant paid, the growers' share, and ours", () => {
    expect(doc.totals.map((t) => [t.label, t.amount])).toEqual([["Billed to restaurant", 1350], ["Paid to growers", 850], ["SproutBox share", 500]]);
  });

  it("lists every grower with their trays and payout, summing to the growers' share", () => {
    expect(doc.rows.map((r) => r.description)).toEqual(["Lakshmi Venkatesh", "Suresh Gowda", "Anitha Reddy"]);
    expect(doc.rows.reduce((s, r) => s + r.amount, 0)).toBe(850);
    expect(doc.rows[1].detail).toBe("7 allocated, 1 rejected at QC");
  });

  it("states our share as a percentage and is settled once every grower is paid", () => {
    expect(doc.notes[0]).toContain("37%");
    expect(doc.status.label).toBe("SETTLED");
    expect(settlementStatement({ order, restaurantName: "x", deliveredAt: null, growers: [{ ...growers[0], paid: false }] }).status.label).toBe("OPEN");
  });
});
