import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterChips } from "./filter-chips";
import { SegmentedControl } from "./segmented-control";

const chips = [
  { value: "all", label: "All", count: 12 },
  { value: "pending", label: "Pending", count: 3 },
  { value: "paid", label: "Paid" },
];

describe("FilterChips", () => {
  it("marks the active chip and shows counts only when given", () => {
    render(<FilterChips chips={chips} value="pending" onChange={() => {}} ariaLabel="Filter payouts" />);
    expect(screen.getByRole("group", { name: "Filter payouts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pending/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paid" })).toBeInTheDocument();
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    render(<FilterChips chips={chips} value="all" onChange={onChange} ariaLabel="Filter" />);
    fireEvent.click(screen.getByRole("button", { name: "Paid" }));
    expect(onChange).toHaveBeenCalledWith("paid");
  });

  it("renders links for server-side filtering, with aria-current on the active one", () => {
    render(<FilterChips chips={chips} value="paid" hrefFor={(v) => `/admin/payouts?status=${v}`} ariaLabel="Filter" />);
    const paid = screen.getByRole("link", { name: "Paid" });
    expect(paid).toHaveAttribute("href", "/admin/payouts?status=paid");
    expect(paid).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /All/ })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("SegmentedControl", () => {
  const options = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
  ];

  it("exposes a radiogroup with the current option checked", () => {
    render(<SegmentedControl options={options} value="30d" onChange={() => {}} ariaLabel="Range" />);
    expect(screen.getByRole("radiogroup", { name: "Range" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "30 days" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "7 days" })).toHaveAttribute("aria-checked", "false");
  });

  it("reports the chosen option", () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="30d" onChange={onChange} ariaLabel="Range" />);
    fireEvent.click(screen.getByRole("radio", { name: "7 days" }));
    expect(onChange).toHaveBeenCalledWith("7d");
  });
});
