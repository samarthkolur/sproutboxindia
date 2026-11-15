import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

let pathname = "/";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
// Both toggles read app-wide providers and have their own coverage.
vi.mock("@/components/i18n/LanguageToggle", () => ({ LanguageToggle: () => <div data-testid="language" /> }));
vi.mock("@/components/layout/ThemeToggle", () => ({ ThemeToggle: () => <div data-testid="theme" /> }));

import { MarketingFooter } from "./MarketingFooter";
import { MARKETING_LINKS } from "./links";
import { MarketingNav } from "./MarketingNav";

beforeEach(() => {
  pathname = "/";
});

describe("MarketingNav", () => {
  it("links to every public section from one nav", () => {
    render(<MarketingNav />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(MARKETING_LINKS.map((l) => l.href));
  });

  it("uses anchors that work from any page, and every anchor target exists on the landing page", () => {
    for (const link of MARKETING_LINKS) {
      if (link.href.startsWith("/#")) expect(link.href).toMatch(/^\/#[a-z-]+$/);
    }
  });

  it("offers sign in and get started, and a way home", () => {
    render(<MarketingNav />);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "SproutBox home" })).toHaveAttribute("href", "/");
  });

  it("marks the current page", () => {
    pathname = "/about";
    render(<MarketingNav />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("opens and closes the mobile menu with the button, a link and Escape", () => {
    render(<MarketingNav />);
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById("marketing-menu") as HTMLElement;
    expect(within(menu).getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(within(menu).getByTestId("language")).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole("link", { name: "About" }));
    expect(document.getElementById("marketing-menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.getElementById("marketing-menu")).toBeNull();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<MarketingNav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("MarketingFooter", () => {
  it("links to the platform pages and the account routes", () => {
    render(<MarketingFooter />);
    for (const [name, href] of [
      ["About", "/about"],
      ["Sign In", "/login"],
      ["Create Account", "/register"],
      ["Join as Grower", "/join/grower"],
      ["Partner as Restaurant", "/join/restaurant"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("shows the current year in one text node, so the translator can match it", () => {
    render(<MarketingFooter />);
    expect(screen.getByText(`© ${new Date().getFullYear()} SproutBox. All rights reserved.`)).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<MarketingFooter />);
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("server/client boundary", () => {
  // jsdom cannot catch this: calling .map on data imported from a "use client" file
  // only fails when Next renders the server component.
  it("keeps the shared link data out of 'use client' files", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/components/marketing");
    expect(readFileSync(join(dir, "links.ts"), "utf8")).not.toMatch(/^\s*["']use client["']/);
    expect(readFileSync(join(dir, "MarketingFooter.tsx"), "utf8")).not.toMatch(/^\s*["']use client["']/);
    expect(readFileSync(join(dir, "MarketingFooter.tsx"), "utf8")).not.toContain("./MarketingNav");
  });
});
