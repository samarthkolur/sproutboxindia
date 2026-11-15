// @vitest-environment node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the checklist in UI_REWORK.md: every page.tsx that exists must be planned,
// and every planned page must exist, so no page is quietly missed during the rework.

const ROOT = process.cwd();
const APP = join(ROOT, "src/app");

// Planned but not built yet (the new admin restaurant detail page is Phase 4).
const PLANNED_NEW = new Set(["/admin/restaurants/[restaurantId]"]);

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return name === "page.tsx" ? [full] : [];
  });
}

function routeOf(file: string): string {
  const segments = relative(APP, join(file, ".."))
    .split(sep)
    .filter((segment) => !/^\(.*\)$/.test(segment)); // route groups don't appear in URLs
  return "/" + segments.join("/");
}

const routes = pageFiles(APP).map(routeOf).sort();

const plan = readFileSync(join(ROOT, "UI_REWORK.md"), "utf8");
const planned = Array.from(plan.matchAll(/^- \[[ x~]\] \*\*`([^`]+)`/gm), (m) => m[1]);

describe("UI_REWORK.md covers every page", () => {
  it("finds the pages on disk and entries in the plan", () => {
    expect(routes.length).toBeGreaterThanOrEqual(35);
    expect(planned.length).toBeGreaterThanOrEqual(35);
  });

  it("lists each existing page exactly once", () => {
    for (const route of routes) {
      const count = planned.filter((p) => p === route).length;
      expect(count, `${route} appears ${count} times in UI_REWORK.md`).toBe(1);
    }
  });

  it("only plans pages that exist, apart from the known new page", () => {
    for (const entry of planned) {
      if (PLANNED_NEW.has(entry)) continue;
      expect(routes, `${entry} is planned but has no page.tsx`).toContain(entry);
    }
  });
});
