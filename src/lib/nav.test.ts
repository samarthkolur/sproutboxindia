// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOCK_HREFS, NAV_GROUPS, PRIMARY_ACTION, flatNav, isNavActive, toRole, type Role } from "./nav";

const ROLES: Role[] = ["ADMIN", "RESTAURANT", "GROWER"];
const BADGE_KEYS = [
  "restaurantAwaitingPayment",
  "growerCheckinsDue",
  "adminDemand",
  "adminAllocations",
  "adminDispatch",
  "adminQc",
  "adminPayouts",
];

describe("toRole", () => {
  it("accepts the three roles", () => {
    expect(toRole("ADMIN")).toBe("ADMIN");
    expect(toRole("RESTAURANT")).toBe("RESTAURANT");
    expect(toRole("GROWER")).toBe("GROWER");
  });

  it("falls back to GROWER for anything else, as the old layout did", () => {
    expect(toRole(undefined)).toBe("GROWER");
    expect(toRole("admin")).toBe("GROWER");
    expect(toRole(42)).toBe("GROWER");
  });
});

describe.each(ROLES)("%s navigation", (role) => {
  const items = flatNav(role);
  const prefix = `/${role.toLowerCase()}/`;

  it("has items, each under the role's own route prefix", () => {
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.href.startsWith(prefix)).toBe(true);
  });

  it("only links to pages that exist", () => {
    for (const item of items) {
      const file = join(process.cwd(), "src/app/(dashboard)", item.href, "page.tsx");
      expect(existsSync(file), `${item.href} has no page.tsx`).toBe(true);
    }
  });

  it("has unique hrefs and labels", () => {
    expect(new Set(items.map((i) => i.href)).size).toBe(items.length);
    expect(new Set(items.map((i) => i.label)).size).toBe(items.length);
  });

  it("only uses known badge keys, once each", () => {
    const badges = items.map((i) => i.badge).filter(Boolean) as string[];
    for (const key of badges) expect(BADGE_KEYS).toContain(key);
    expect(new Set(badges).size).toBe(badges.length);
  });

  it("puts every dock item in the nav and keeps the dock to four", () => {
    const hrefs = items.map((i) => i.href);
    expect(DOCK_HREFS[role].length).toBe(4);
    for (const href of DOCK_HREFS[role]) expect(hrefs).toContain(href);
  });

  it("has a primary action that points at a real nav destination", () => {
    expect(items.map((i) => i.href)).toContain(PRIMARY_ACTION[role].href);
  });
});

describe("admin pipeline", () => {
  it("is numbered 1 to 5 in order, because it is a real sequence", () => {
    const pipeline = NAV_GROUPS.ADMIN.find((group) => group.label === "Pipeline");
    expect(pipeline?.items.map((i) => i.step)).toEqual([1, 2, 3, 4, 5]);
    expect(pipeline?.items.map((i) => i.href)).toEqual([
      "/admin/demand",
      "/admin/allocate",
      "/admin/dispatch",
      "/admin/qc",
      "/admin/payouts",
    ]);
  });
});

describe("isNavActive", () => {
  it("matches the page and its sub-pages", () => {
    expect(isNavActive("/admin/qc", "/admin/qc")).toBe(true);
    expect(isNavActive("/admin/qc/abc123", "/admin/qc")).toBe(true);
  });

  it("does not match a sibling with the same prefix", () => {
    expect(isNavActive("/admin/quality", "/admin/qc")).toBe(false);
    expect(isNavActive("/grower/tasks", "/grower/task")).toBe(false);
  });
});
