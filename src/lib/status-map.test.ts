// @vitest-environment node
import { BatchStatus, DeliveryStatus, OrderStatus, PayoutStatus, QCResult, TaskStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { STATUS_MAP } from "@/components/ui/status-chip";

// If a new enum value is added to the schema and not given a chip, a status would
// silently render as raw SNAKE_CASE. These tests make that a failing build instead.
describe("STATUS_MAP covers every status in the schema", () => {
  const enums = { OrderStatus, TaskStatus, BatchStatus, DeliveryStatus, PayoutStatus, QCResult };

  for (const [name, values] of Object.entries(enums)) {
    it(`${name}`, () => {
      for (const value of Object.values(values)) {
        expect(STATUS_MAP[value], `${name}.${value} has no entry`).toBeDefined();
      }
    });
  }

  it("gives every entry a human label that is not the raw key", () => {
    for (const [key, entry] of Object.entries(STATUS_MAP)) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.label, `${key} label looks like an enum`).not.toMatch(/^[A-Z_]+$/);
    }
  });
});
