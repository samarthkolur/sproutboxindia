import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { FatalErrorPanel } from "@/components/shared/FatalErrorPanel";
import { NotFoundView } from "@/components/shared/NotFoundView";

describe("404 page", () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => vi.unstubAllGlobals());

  it("sends a visitor to the landing page", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<NotFoundView />);
    expect(screen.getByRole("heading", { level: 1, name: "This page doesn't exist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/session"));
    expect(screen.getByRole("link", { name: "Back to home" })).toBeInTheDocument();
  });

  it("sends a signed-in person to their own dashboard once the session answers", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ user: { name: "Asha" } }) });
    render(<NotFoundView />);
    expect(await screen.findByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("falls back to the landing page if the session lookup fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<NotFoundView />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  // auth() / cookies() here make Next render every page in the app dynamically, which
  // turned the static landing and auth pages into server-rendered ones. Found in the build table.
  it("reads no session on the server, so the rest of the app can stay static", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(join(process.cwd(), "src/app/not-found.tsx"), "utf8");
    expect(source).not.toMatch(/from "@\/lib\/auth"|next\/headers|cookies\(|headers\(|auth\(/);
  });

  it("has Kannada and Hindi for everything it says", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ user: {} }) });
    const { container } = render(<NotFoundView />);
    expect(findUntranslated(container)).toEqual([]);
    await screen.findByRole("link", { name: "Go to your dashboard" });
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
