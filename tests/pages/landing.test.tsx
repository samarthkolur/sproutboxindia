import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MARKETING_LINKS } from "@/components/marketing/links";
import { LANDING_FACTS } from "@/components/marketing/landing/facts";
import { CROP_CYCLE_DAYS, CROP_DISPLAY_NAMES, CROP_PRICE_PER_KG, CROP_TYPES } from "@/lib/constants";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import LandingPage from "@/app/(marketing)/page";

describe("landing page", () => {
  it("has exactly one h1, the headline", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Farm-to-fork, door to door.");
  });

  it("has a section for every anchor the nav links to", () => {
    const { container } = render(<LandingPage />);
    for (const link of MARKETING_LINKS) {
      if (!link.href.startsWith("/#")) continue;
      const id = link.href.slice(2);
      expect(container.querySelector(`#${id}`), `no section with id="${id}"`).not.toBeNull();
    }
  });

  it("sends growers and restaurants to their own join pages, and nothing to dead anchors", () => {
    const { container } = render(<LandingPage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/join/grower");
    expect(hrefs).toContain("/join/restaurant");
    for (const href of hrefs) expect(href, "link must be a real route").toMatch(/^\//);
  });

  it("shows the real catalog: every crop with its price and grow time from the constants", () => {
    render(<LandingPage />);
    const catalog = screen.getByLabelText("Crop catalog");
    for (const crop of CROP_TYPES) {
      const row = within(catalog).getByText(CROP_DISPLAY_NAMES[crop]).closest("li")!;
      expect(row).toHaveTextContent(`₹${CROP_PRICE_PER_KG[crop]}/kg`);
      expect(row).toHaveTextContent(`${CROP_CYCLE_DAYS[crop]} days`);
    }
  });

  it("states its figures from the constants, not typed-in numbers", () => {
    render(<LandingPage />);
    expect(screen.getByText(`Earn ₹${LANDING_FACTS.payoutPerTray}+ per tray`)).toBeInTheDocument();
    expect(screen.getByText(`Start with ${LANDING_FACTS.startTrays} trays`)).toBeInTheDocument();
    expect(screen.getByText(`${LANDING_FACTS.varieties} varieties, transparent pricing`)).toBeInTheDocument();
    expect(screen.getByText(`${LANDING_FACTS.bufferPercent}%`)).toBeInTheDocument();
  });

  it("labels the product mocks as illustrative and carries no invented traction", () => {
    const { container } = render(<LandingPage />);
    expect(screen.getAllByText("Sample dashboard — illustrative preview")).toHaveLength(2);
    for (const fake of ["+12%", "+18%", "127", "₹48.5K", "94%"]) {
      expect(container.textContent).not.toContain(fake);
    }
  });

  it("does not promise automatic repeat orders, which the backend does not generate", () => {
    const { container } = render(<LandingPage />);
    expect(container.textContent).not.toMatch(/auto-?order/i);
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<LandingPage />);
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("LANDING_FACTS", () => {
  it("derives from the same constants the app uses", () => {
    expect(LANDING_FACTS.varieties).toBe(CROP_TYPES.length);
    expect(LANDING_FACTS.minDays).toBe(Math.min(...Object.values(CROP_CYCLE_DAYS)));
    expect(LANDING_FACTS.maxDays).toBe(Math.max(...Object.values(CROP_CYCLE_DAYS)));
    expect(LANDING_FACTS.minDays).toBeLessThan(LANDING_FACTS.maxDays);
  });
});
