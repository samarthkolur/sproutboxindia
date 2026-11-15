import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { FatalErrorPanel } from "@/components/shared/FatalErrorPanel";
import { NotFoundView } from "@/components/shared/NotFoundView";

describe("404 page", () => {
  it("sends a visitor to the landing page", () => {
    render(<NotFoundView signedIn={false} />);
    expect(screen.getByRole("heading", { level: 1, name: "This page doesn't exist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("sends a signed-in person to their own dashboard", () => {
    render(<NotFoundView signedIn />);
    expect(screen.getByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container, rerender } = render(<NotFoundView signedIn={false} />);
    expect(findUntranslated(container)).toEqual([]);
    rerender(<NotFoundView signedIn />);
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("global error page", () => {
  // It replaces the root layout, so without its own data-theme the colour tokens would not apply.
  it("sets the theme attribute itself and uses tokens, not a hardcoded colour", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(join(process.cwd(), "src/app/global-error.tsx"), "utf8");
    expect(source).toContain('data-theme="light"');
    for (const file of ["src/app/global-error.tsx", "src/components/shared/FatalErrorPanel.tsx"]) {
      expect(readFileSync(join(process.cwd(), file), "utf8")).not.toMatch(/#[0-9A-Fa-f]{6}/);
    }
  });

  it("offers a retry and a way home", () => {
    const retry = vi.fn();
    render(<FatalErrorPanel onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<FatalErrorPanel onRetry={() => {}} />);
    expect(findUntranslated(container)).toEqual([]);
  });
});
