import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./status-chip";

describe("StatusChip", () => {
  it("shows the human label for an enum value, never the raw key", () => {
    render(<StatusChip status="QC_PENDING" />);
    expect(screen.getByText("QC pending")).toBeInTheDocument();
    expect(screen.queryByText("QC_PENDING")).not.toBeInTheDocument();
  });

  it("applies the tone from the map", () => {
    const { container } = render(<StatusChip status="DELIVERED" />);
    expect(container.firstChild).toHaveClass("text-good");
  });

  it("lets an explicit label and tone override the map", () => {
    const { container } = render(<StatusChip status="DELIVERED" label="Handed over" tone="risk" />);
    expect(screen.getByText("Handed over")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-risk");
  });

  it("falls back to neutral and the raw text for an unknown status", () => {
    const { container } = render(<StatusChip status="SOMETHING_NEW" />);
    expect(screen.getByText("SOMETHING_NEW")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-ink-soft");
  });

  it("never relies on colour alone: the dot is decorative and the word is present", () => {
    const { container } = render(<StatusChip status="FAILED" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
