import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoiceLink, invoiceHref } from "./InvoiceLink";

describe("InvoiceLink", () => {
  it("is a download link, not a navigation", () => {
    render(<InvoiceLink href="/api/invoices/restaurant/o1" label="Download invoice" />);
    const link = screen.getByRole("link", { name: "Download invoice" });
    expect(link).toHaveAttribute("href", "/api/invoices/restaurant/o1");
    expect(link).toHaveAttribute("download");
  });

  it("can carry a fuller accessible name when the label repeats down a list", () => {
    render(<InvoiceLink href="/x" label="Invoice" ariaLabel="Download invoice for order ABC" />);
    expect(screen.getByRole("link", { name: "Download invoice for order ABC" })).toBeInTheDocument();
  });

  it("builds the three document addresses", () => {
    expect(invoiceHref.restaurant("o1")).toBe("/api/invoices/restaurant/o1");
    expect(invoiceHref.grower("t1")).toBe("/api/invoices/grower/t1");
    expect(invoiceHref.platform("o1")).toBe("/api/invoices/platform/o1");
  });
});
