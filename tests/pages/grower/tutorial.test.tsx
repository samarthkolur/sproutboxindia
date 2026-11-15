import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CROP_CYCLE_DAYS, CROP_DISPLAY_NAMES, CROP_INSTRUCTIONS, CROP_TYPES } from "@/lib/constants";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import TutorialPage from "@/app/(dashboard)/grower/tutorial/page";

const renderPage = (crop?: string) => render(<TutorialPage searchParams={{ crop }} />);

describe("grower tutorial", () => {
  it("offers a chip for every crop and opens on sunflower", () => {
    renderPage();
    const chips = screen.getByRole("group", { name: "Choose a crop" });
    for (const crop of CROP_TYPES) {
      expect(within(chips).getByRole("link", { name: CROP_DISPLAY_NAMES[crop] })).toHaveAttribute("href", `/grower/tutorial?crop=${crop}`);
    }
    expect(within(chips).getByRole("link", { name: "Sunflower Shoots" })).toHaveAttribute("aria-current", "true");
  });

  it("shows the real instructions for the chosen crop, one step per day", () => {
    renderPage("radish");
    expect(screen.getByRole("heading", { name: "Radish" })).toBeInTheDocument();
    expect(screen.getByText(`${CROP_CYCLE_DAYS.radish} days from sowing to harvest`)).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem").filter((li) => li.closest("ol"));
    expect(steps).toHaveLength(CROP_CYCLE_DAYS.radish);
    expect(steps[0]).toHaveTextContent(CROP_INSTRUCTIONS.radish[1]);
    expect(steps[steps.length - 1]).toHaveTextContent(CROP_INSTRUCTIONS.radish[CROP_CYCLE_DAYS.radish]);
  });

  it("uses each crop's own schedule, not one generic range", () => {
    for (const crop of CROP_TYPES) {
      const { unmount } = renderPage(crop);
      expect(screen.getAllByRole("listitem").filter((li) => li.closest("ol"))).toHaveLength(CROP_CYCLE_DAYS[crop]);
      unmount();
    }
  });

  it("falls back to sunflower for an unknown crop", () => {
    renderPage("dragonfruit");
    expect(screen.getByRole("heading", { name: "Sunflower Shoots" })).toBeInTheDocument();
  });

  it("marks no step as done or current: it is a guide, not progress", () => {
    renderPage();
    for (const step of screen.getAllByRole("listitem").filter((li) => li.closest("ol"))) {
      expect(step).not.toHaveAttribute("aria-current");
    }
  });

  it("keeps the tips as an accordion that opens on demand", () => {
    const { container } = renderPage();
    const tips = container.querySelectorAll("details");
    expect(tips.length).toBeGreaterThanOrEqual(4);
    for (const tip of Array.from(tips)) expect(tip.open).toBe(false);
  });

  it("has Kannada and Hindi for everything it says, for every crop", () => {
    for (const crop of CROP_TYPES) {
      const { container, unmount } = renderPage(crop);
      expect(findUntranslated(container), crop).toEqual([]);
      unmount();
    }
  });
});
