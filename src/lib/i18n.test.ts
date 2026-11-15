// @vitest-environment node
import { describe, expect, it } from "vitest";
import { STATUS_MAP } from "@/components/ui/status-chip";
import { CROP_INSTRUCTIONS } from "@/lib/constants";
import { NAV_GROUPS, ROLE_LABEL } from "@/lib/nav";
import { translateText, translations } from "./i18n";

// The translator is an exact-match dictionary over English text, so every string
// the new UI shows must be a key, or Kannada and Hindi users see English.
const SHELL_STRINGS = [
  "Search pages…",
  "Search pages",
  "No pages match",
  "Notifications",
  "No notifications yet",
  "Mark all as read",
  "Could not load notifications. Close this and try again.",
  "Loading…",
  "More",
  "Close",
  "Account menu",
  "Expand sidebar",
  "Collapse sidebar",
  "Main navigation",
  "Switch to light theme",
  "Switch to dark theme",
  "Sign out",
  "Awaiting QC",
  "All clear",
  "No batches waiting",
  "batch to review",
  "batches to review",
  "Next delivery",
  "None scheduled",
  "Place an order",
  "Next check-in",
  "All checked in",
  "Nothing due today",
  "Select all",
  "Select row",
  "This page could not load",
  "Something went wrong while fetching your data. Try again, or go back to your dashboard.",
  "Try again",
  "Back to home",
  "Loading page",
  "Close photo",
  "Previous photo",
  "Next photo",
  "New allocation",
  "New order",
  "Check in",
  "Operations",
];

function expectTranslated(text: string) {
  const entry = translations[text];
  expect(entry, `missing translation: "${text}"`).toBeDefined();
  expect(entry.kn.trim().length).toBeGreaterThan(0);
  expect(entry.hi.trim().length).toBeGreaterThan(0);
}

describe("new UI strings are translated", () => {
  it("shell and shared-component strings", () => {
    for (const text of SHELL_STRINGS) expectTranslated(text);
  });

  it("every status chip label", () => {
    for (const { label } of Object.values(STATUS_MAP)) expectTranslated(label);
  });

  it("every navigation label and group label", () => {
    for (const groups of Object.values(NAV_GROUPS)) {
      for (const group of groups) {
        if (group.label) expectTranslated(group.label);
        for (const item of group.items) expectTranslated(item.label);
      }
    }
  });

  it("role labels", () => {
    for (const label of Object.values(ROLE_LABEL)) expectTranslated(label);
  });
});

describe("translateText", () => {
  it("returns English text unchanged", () => {
    expect(translateText("Pipeline", "en")).toBe("Pipeline");
  });

  it("translates a key into Kannada and Hindi", () => {
    expect(translateText("Pipeline", "kn")).toBe(translations.Pipeline.kn);
    expect(translateText("Pipeline", "hi")).toBe(translations.Pipeline.hi);
  });

  it("keeps surrounding whitespace", () => {
    expect(translateText("  Pipeline ", "hi")).toBe(`  ${translations.Pipeline.hi} `);
  });

  it("leaves unknown text alone", () => {
    expect(translateText("Totally unknown sentence", "kn")).toBe("Totally unknown sentence");
  });

  it("translates the 'Day N' pinned value and the older 'Day X of Y' rule", () => {
    expect(translateText("Day 4", "kn")).toBe("ದಿನ 4");
    expect(translateText("Day 4", "hi")).toBe("दिन 4");
    expect(translateText("Day 4 of 9", "hi")).toBe("9 में से दिन 4");
  });
});

describe("crop instructions", () => {
  it("has Kannada and Hindi for every day of every crop, since growers read them daily", () => {
    for (const [crop, days] of Object.entries(CROP_INSTRUCTIONS)) {
      for (const [day, text] of Object.entries(days)) {
        for (const language of ["kn", "hi"] as const) {
          expect(translateText(text, language), `${crop} day ${day} (${language})`).not.toBe(text);
        }
      }
    }
  });
});
