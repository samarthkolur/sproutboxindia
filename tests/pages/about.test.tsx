import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { findUntranslated } from "@/test/translation";
import AboutPage from "@/app/(marketing)/about/page";

describe("/about", () => {
  it("has one h1 and the four values as headings", () => {
    render(<AboutPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const value of ["Hyper-Local", "Community First", "Health & Quality", "Less Waste"]) {
      expect(screen.getByRole("heading", { name: value })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Our Story" })).toBeInTheDocument();
  });

  it("ends with a call to action for both audiences", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Join as Grower" })).toHaveAttribute("href", "/join/grower");
    expect(screen.getByRole("link", { name: "Partner as Restaurant" })).toHaveAttribute("href", "/join/restaurant");
  });

  it("does not make claims the product cannot back up", () => {
    const { container } = render(<AboutPage />);
    expect(container.textContent).not.toMatch(/5\s?km/i);
    expect(container.textContent).not.toMatch(/40x/i);
    expect(container.textContent).not.toMatch(/zero waste/i);
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<AboutPage />);
    expect(findUntranslated(container)).toEqual([]);
  });
});
