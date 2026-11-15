import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { batch, task } from "@/test/grower-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/shared/ImageUploader", () => ({ ImageUploader: () => null }));

const getGrowerTasks = vi.fn();
vi.mock("@/lib/grower-data", () => ({ getGrowerTasks: (...args: unknown[]) => getGrowerTasks(...args) }));

import GrowerTasksPage from "@/app/(dashboard)/grower/tasks/page";

const growing = task({ id: "t-growing" });
const finished = task({ id: "t-done", cropType: "radish", status: "HARVESTED", batches: [batch({ currentDay: 7, status: "HARVESTED" })] });
const ready = task({ id: "t-ready", cropType: "mustard", status: "HARVEST_READY", batches: [batch({ currentDay: 7 })] });
const full = task({ id: "t-full", cropType: "pea-shoots", batches: [batch({ currentDay: 8 })] });

async function renderPage(filter?: string) {
  return render(await GrowerTasksPage({ searchParams: { filter } }));
}

describe("grower tasks", () => {
  beforeEach(() => getGrowerTasks.mockReset());

  it("opens on active tasks and counts every list on its chip", async () => {
    getGrowerTasks.mockResolvedValue([growing, ready, finished]);
    await renderPage();
    const chips = screen.getByRole("group", { name: "Filter tasks" });
    expect(within(chips).getByRole("link", { name: /Active/ })).toHaveTextContent("1");
    expect(within(chips).getByRole("link", { name: /Ready for pickup/ })).toHaveTextContent("1");
    expect(within(chips).getByRole("link", { name: /Completed/ })).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: "Sunflower Shoots" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mustard" })).not.toBeInTheDocument();
  });

  it("scopes the read to the signed-in user", async () => {
    getGrowerTasks.mockResolvedValue([growing]);
    await renderPage();
    expect(getGrowerTasks).toHaveBeenCalledWith("user-1");
  });

  it("keeps ready-for-pickup tasks in their own list instead of dropping them", async () => {
    getGrowerTasks.mockResolvedValue([growing, ready]);
    await renderPage("pickup");
    expect(screen.getByRole("link", { name: "Mustard" })).toHaveAttribute("href", "/grower/tasks/t-ready");
    expect(screen.getByText("Pickup requested")).toBeInTheDocument();
  });

  it("lists completed tasks under their own filter", async () => {
    getGrowerTasks.mockResolvedValue([growing, finished]);
    await renderPage("completed");
    expect(screen.getByRole("link", { name: "Radish" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sunflower Shoots" })).not.toBeInTheDocument();
  });

  it("treats an unknown filter as active", async () => {
    getGrowerTasks.mockResolvedValue([growing, finished]);
    await renderPage("nonsense");
    expect(screen.getByRole("link", { name: "Sunflower Shoots" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Radish" })).not.toBeInTheDocument();
  });

  it("gives each card one primary action: check in", async () => {
    getGrowerTasks.mockResolvedValue([growing]);
    await renderPage();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Check in" })).toBeInTheDocument();
  });

  it("gives a finished cycle a pickup action instead", async () => {
    getGrowerTasks.mockResolvedValue([full]);
    await renderPage();
    expect(screen.getByRole("button", { name: "Request Pickup" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
  });

  it("shows today's instruction for an open task", async () => {
    getGrowerTasks.mockResolvedValue([growing]);
    await renderPage();
    expect(screen.getByText(/Remove cover tray/)).toBeInTheDocument();
  });

  it("uses the same day count as the detail page (from the crop table, not the dates)", async () => {
    getGrowerTasks.mockResolvedValue([task({ harvestDate: new Date(Date.now() + 40 * 86400000) })]);
    await renderPage();
    expect(screen.getByText("5 trays · Day 3 of 9")).toBeInTheDocument();
  });

  it("explains an empty filter and offers a way back", async () => {
    getGrowerTasks.mockResolvedValue([growing]);
    await renderPage("completed");
    expect(screen.getByText("No completed tasks yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to active tasks" })).toHaveAttribute("href", "/grower/tasks");
  });

  it("has a first-run empty state", async () => {
    getGrowerTasks.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText("No tasks assigned")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says, on every filter", async () => {
    getGrowerTasks.mockResolvedValue([growing, ready, finished, full]);
    for (const filter of [undefined, "pickup", "completed"]) {
      const { container, unmount } = await renderPage(filter);
      expect(findUntranslated(container), `filter ${filter}`).toEqual([]);
      unmount();
    }
  });
});
