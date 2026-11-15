import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOCK_HREFS, flatNav } from "@/lib/nav";

let pathname = "/admin/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("./ThemeToggle", () => ({ ThemeToggle: () => <div data-testid="theme" /> }));
vi.mock("@/components/i18n/LanguageToggle", () => ({ LanguageToggle: () => <div data-testid="lang" /> }));

import { BottomDock } from "./BottomDock";
import { Sidebar } from "./Sidebar";

const pinned = { label: "Awaiting QC", value: "5", caption: "batches to review", href: "/admin/qc" };

function sidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  return render(
    <Sidebar
      role="ADMIN"
      userName="Asha"
      workspace="Bengaluru North"
      badges={{ adminQc: 5, adminPayouts: 120 }}
      pinned={pinned}
      collapsed={false}
      onToggle={() => {}}
      {...overrides}
    />
  );
}

beforeEach(() => {
  pathname = "/admin/dashboard";
});

describe("Sidebar", () => {
  it("lists the admin navigation grouped, with the pipeline steps numbered", () => {
    sidebar();
    const nav = screen.getByRole("navigation");
    for (const label of ["Pipeline", "Network", "Insights"]) expect(within(nav).getByText(label)).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /QC Review/ })).toHaveTextContent("4");
  });

  it("marks only the current page with aria-current", () => {
    pathname = "/admin/qc/batch-7";
    sidebar();
    const nav = screen.getByRole("navigation");
    const current = within(nav).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/admin/qc");
  });

  it("shows badge counts, capped at 99+, and nothing for zero", () => {
    sidebar({ badges: { adminQc: 5, adminPayouts: 120, adminDemand: 0 } });
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("link", { name: /QC Review/ })).toHaveTextContent("5");
    expect(within(nav).getByRole("link", { name: /Payouts/ })).toHaveTextContent("99+");
    expect(within(nav).getByRole("link", { name: /Demand/ })).not.toHaveTextContent(/\b0\b/);
  });

  it("shows the pinned next-action card as a link", () => {
    sidebar();
    const card = screen.getByRole("link", { name: /Awaiting QC/ });
    expect(card).toHaveAttribute("href", "/admin/qc");
    expect(card).toHaveTextContent("batches to review");
  });

  it("shows the user and a sign-out link", () => {
    sidebar();
    expect(screen.getByText("Asha")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute("href", "/signout");
  });

  it("collapses to icons: no group headings or pinned card, labels move to titles", () => {
    sidebar({ collapsed: true });
    expect(screen.queryByText("Pipeline")).not.toBeInTheDocument();
    expect(screen.queryByText("batches to review")).not.toBeInTheDocument();
    expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("asks the shell to toggle", () => {
    const onToggle = vi.fn();
    sidebar({ onToggle });
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders the right items for each role", () => {
    const { unmount } = sidebar({ role: "GROWER", badges: { growerCheckinsDue: 2 } });
    const nav = screen.getByRole("navigation");
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(
      flatNav("GROWER").map((item) => item.href)
    );
    unmount();
  });
});

describe("BottomDock", () => {
  it("shows the four dock destinations plus More", () => {
    pathname = "/grower/dashboard";
    render(<BottomDock role="GROWER" badges={{}} />);
    const dock = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(dock).getAllByRole("link")).toHaveLength(DOCK_HREFS.GROWER.length);
    expect(within(dock).getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("shows a text label only for the active item", () => {
    pathname = "/grower/tasks/abc";
    render(<BottomDock role="GROWER" badges={{}} />);
    const dock = screen.getByRole("navigation", { name: "Main navigation" });
    const active = within(dock).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    const tasksLabel = flatNav("GROWER").find((item) => item.href === "/grower/tasks")!.label;
    expect(active[0].textContent?.trim()).toBe(tasksLabel);
    for (const link of within(dock).getAllByRole("link")) {
      if (link !== active[0]) expect(link.textContent?.trim()).toBe("");
    }
  });

  it("badges inactive items and sums hidden items' badges onto More", () => {
    pathname = "/admin/dashboard";
    render(<BottomDock role="ADMIN" badges={{ adminQc: 4, adminPayouts: 3, adminDemand: 1 }} />);
    const dock = screen.getByRole("navigation", { name: "Main navigation" });
    const counts: Record<string, number> = { adminQc: 4, adminPayouts: 3, adminDemand: 1 };
    const hidden = flatNav("ADMIN").filter((item) => !DOCK_HREFS.ADMIN.includes(item.href));
    const expected = hidden.reduce((sum, item) => sum + (item.badge ? counts[item.badge] ?? 0 : 0), 0);
    const more = within(dock).getByRole("button", { name: "More" });
    if (expected > 0) expect(more).toHaveTextContent(expected > 9 ? "9+" : String(expected));
    else expect(more).not.toHaveTextContent(/\d/);

    // Dock items that are not active carry their own badge.
    for (const href of DOCK_HREFS.ADMIN) {
      const item = flatNav("ADMIN").find((i) => i.href === href)!;
      const link = within(dock).getByRole("link", { name: item.label });
      const own = item.badge ? counts[item.badge] ?? 0 : 0;
      if (own > 0 && link.getAttribute("aria-current") !== "page") expect(link).toHaveTextContent(String(own));
    }
  });

  it("opens the More sheet with every destination and closes it again", () => {
    pathname = "/grower/dashboard";
    render(<BottomDock role="GROWER" badges={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));

    const sheet = screen.getByRole("dialog", { name: "More" });
    for (const item of flatNav("GROWER")) {
      expect(within(sheet).getByRole("link", { name: new RegExp(item.label) })).toHaveAttribute("href", item.href);
    }
    expect(within(sheet).getByRole("link", { name: "Sign out" })).toBeInTheDocument();

    fireEvent.click(within(sheet).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the sheet on Escape", () => {
    pathname = "/grower/dashboard";
    render(<BottomDock role="GROWER" badges={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
