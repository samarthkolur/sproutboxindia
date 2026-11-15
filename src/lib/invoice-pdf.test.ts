// @vitest-environment node
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { growerStatement, restaurantInvoice, settlementStatement } from "./invoices";
import { renderInvoicePdf } from "./invoice-pdf";

const created = new Date(2026, 9, 13, 11, 20);
const order = { id: "cmabc12345xyz", cropType: "sunflower", quantityKg: 3, totalPrice: 1350, status: "DELIVERED", createdAt: created, deliveryDate: new Date(2026, 9, 25) };

describe("renderInvoicePdf", () => {
  it("produces a real one-page A4 PDF for a restaurant invoice", async () => {
    const doc = restaurantInvoice({
      order,
      restaurant: { businessName: "The Green Bowl", contactName: "Arjun Mehta", address: "14, 80 Feet Road, 5th Block, Koramangala", city: "Bengaluru", pincode: "560095", phone: "9000000021", gstin: null },
      deliveredAt: new Date(2026, 9, 25),
    });
    const bytes = await renderInvoicePdf(doc);
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBe(1);
    const { width, height } = parsed.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842]);
    expect(parsed.getTitle()).toBe(`Invoice ${doc.number}`);
  });

  it("draws the rupee sign and other characters the standard fonts lack without failing", async () => {
    const doc = restaurantInvoice({
      order,
      restaurant: { businessName: "Café Ṅandhini ₹ 日本", contactName: "Arjun", address: "x", city: "y", pincode: "1", phone: "2", gstin: null },
      deliveredAt: null,
    });
    await expect(renderInvoicePdf(doc)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("renders a grower statement and a settlement statement", async () => {
    const statement = growerStatement({
      task: { id: "cmtask0001zzz", cropType: "sunflower", trayCount: 2, sowDate: created, harvestDate: created, orderId: order.id },
      grower: { name: "Suresh Gowda", address: "112, 14th Main", city: "Bengaluru", pincode: "560102", phone: "9000000002", upiId: "9000000002@ybl" },
      batches: [{ status: "HARVESTED", harvestedAt: created, payout: { amount: 50, status: "PAID", paidAt: created, createdAt: created } }],
    });
    const settlement = settlementStatement({ order, restaurantName: "The Green Bowl", deliveredAt: created, growers: [{ name: "Suresh Gowda", trays: 6, rejected: 1, payout: 300, paid: true }] });
    for (const doc of [statement, settlement]) {
      const parsed = await PDFDocument.load(await renderInvoicePdf(doc));
      expect(parsed.getPageCount()).toBe(1);
    }
  });

  it("continues onto a second page when there are too many rows to fit", async () => {
    const growers = Array.from({ length: 40 }, (_, i) => ({ name: `Grower number ${i + 1}`, trays: 3, rejected: 0, payout: 150, paid: true }));
    const doc = settlementStatement({ order, restaurantName: "The Green Bowl", deliveredAt: null, growers });
    const parsed = await PDFDocument.load(await renderInvoicePdf(doc));
    expect(parsed.getPageCount()).toBeGreaterThan(1);
  });
});
