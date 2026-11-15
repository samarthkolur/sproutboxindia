import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline } from "./timeline";

const items = [
  { key: "a", title: "First", state: "done" as const },
  { key: "b", title: "Second", state: "current" as const, meta: "Today" },
  { key: "c", title: "Third", state: "upcoming" as const },
];

describe("Timeline", () => {
  it("is an ordered list with one step per item", () => {
    render(<Timeline items={items} />);
    expect(screen.getByRole("list")).toBeInstanceOf(HTMLOListElement);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks only the current step for assistive tech", () => {
    render(<Timeline items={items} />);
    const [done, current, upcoming] = screen.getAllByRole("listitem");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(done).not.toHaveAttribute("aria-current");
    expect(upcoming).not.toHaveAttribute("aria-current");
  });

  it("numbers pending steps and shows a check for finished ones", () => {
    render(<Timeline items={items} />);
    const [done, current] = screen.getAllByRole("listitem");
    expect(done.querySelector("svg")).not.toBeNull();
    expect(current).toHaveTextContent("2");
  });

  it("shows plain guide steps as numbered, with none marked current or done", () => {
    render(<Timeline items={[{ key: "1", title: "Soak", state: "step" }, { key: "2", title: "Sow", state: "step" }]} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("2");
    for (const row of rows) {
      expect(row).not.toHaveAttribute("aria-current");
      expect(row.querySelector("svg")).toBeNull();
    }
  });
});
