import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { batch, daysFromNow, task } from "@/test/grower-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/components/shared/ImageUploader", () => ({ ImageUploader: () => null }));

const getGrowerTask = vi.fn();
vi.mock("@/lib/grower-data", () => ({ getGrowerTask: (...args: unknown[]) => getGrowerTask(...args) }));

import GrowerTaskDetailPage from "@/app/(dashboard)/grower/tasks/[taskId]/page";

const checkIn = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  batchId: "batch-1",
  day: 2,
  imageTopUrl: "https://example.com/top.jpg",
  imageSideUrl: "https://example.com/side.jpg",
  notes: null,
  qcResult: null,
  qcNotes: null,
  qcReviewedAt: null,
  createdAt: daysFromNow(-1),
  ...overrides,
});

async function renderPage() {
  return render(await GrowerTaskDetailPage({ params: { taskId: "task-1" } }));
}

describe("grower task detail", () => {
  beforeEach(() => getGrowerTask.mockReset());

  it("reads only this grower's task", async () => {
    getGrowerTask.mockResolvedValue(task());
    await renderPage();
    expect(getGrowerTask).toHaveBeenCalledWith("user-1", "task-1");
  });

  it("is a 404 for a task that is not theirs", async () => {
    getGrowerTask.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows the crop's display name and a real breadcrumb link", async () => {
    getGrowerTask.mockResolvedValue(task({ cropType: "pea-shoots" }));
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pea Shoots");
    expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "My tasks" })).toHaveAttribute("href", "/grower/tasks");
  });

  it("lays out the day-by-day plan with done, current and upcoming days", async () => {
    getGrowerTask.mockResolvedValue(task());
    await renderPage();
    const timeline = screen.getByRole("heading", { name: "Day by day" }).closest(".panel") as HTMLElement;
    const steps = within(timeline).getAllByRole("listitem");
    expect(steps).toHaveLength(9);
    expect(steps[2]).toHaveTextContent("Done");
    expect(steps[3]).toHaveTextContent("Today");
    expect(steps[3]).toHaveAttribute("aria-current", "step");
    expect(steps[3]).toHaveTextContent("Remove cover tray");
    expect(steps[4]).not.toHaveAttribute("aria-current");
  });

  it("offers exactly one action: check in", async () => {
    getGrowerTask.mockResolvedValue(task());
    await renderPage();
    expect(screen.getAllByRole("button", { name: "Check in" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Request Pickup" })).not.toBeInTheDocument();
  });

  it("offers pickup when the cycle is complete", async () => {
    getGrowerTask.mockResolvedValue(task({ batches: [batch({ currentDay: 9 })] }));
    await renderPage();
    expect(screen.getByRole("button", { name: "Request Pickup" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
  });

  it("lists each tray with its status, and its payout once there is one", async () => {
    getGrowerTask.mockResolvedValue(
      task({
        batches: [
          batch({ id: "b1", trayNumber: 1, status: "QC_PASSED", payout: { amount: 50, status: "PAID" } }),
          batch({ id: "b2", trayNumber: 2, status: "GROWING" }),
        ],
      })
    );
    await renderPage();
    const trays = screen.getByRole("heading", { name: "Trays" }).closest(".panel")!;
    expect(within(trays as HTMLElement).getByText("Tray 1").closest("li")).toHaveTextContent("QC passed");
    expect(within(trays as HTMLElement).getByText("Tray 1").closest("li")).toHaveTextContent("₹50");
    expect(within(trays as HTMLElement).getByText("Tray 2").closest("li")).toHaveTextContent("Growing");
  });

  it("explains a failed tray with the reviewer's reason", async () => {
    getGrowerTask.mockResolvedValue(
      task({
        batches: [
          batch({
            status: "QC_FAILED",
            checkIns: [checkIn({ qcResult: "REJECT", qcNotes: "Mould visible on the left edge" })],
          }),
        ],
      })
    );
    await renderPage();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Tray 1 did not pass quality control");
    expect(alert).toHaveTextContent("Mould visible on the left edge");
  });

  it("says when a failed tray has no recorded reason", async () => {
    getGrowerTask.mockResolvedValue(task({ batches: [batch({ status: "REJECTED", checkIns: [] })] }));
    await renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("No reason was recorded");
  });

  it("shows the check-in history newest first, with QC verdicts and notes", async () => {
    getGrowerTask.mockResolvedValue(
      task({
        batches: [
          batch({
            checkIns: [
              checkIn({ id: "c2", day: 3, qcResult: "PASS" }),
              checkIn({ id: "c1", day: 2, qcResult: "RISK", qcNotes: "Slightly pale" }),
            ],
          }),
        ],
      })
    );
    await renderPage();
    const photos = screen.getByRole("heading", { name: "Check-in photos" }).closest(".panel")! as HTMLElement;
    const rows = within(photos).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Day 3, tray 1");
    expect(rows[0]).toHaveTextContent("Pass");
    expect(rows[1]).toHaveTextContent("Risk");
    expect(rows[1]).toHaveTextContent("Slightly pale");
  });

  it("opens a photo in a lightbox that has a close button", async () => {
    getGrowerTask.mockResolvedValue(task({ batches: [batch({ checkIns: [checkIn()] })] }));
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Tray 1, day 2, top view" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Close photo" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close photo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains an empty history", async () => {
    getGrowerTask.mockResolvedValue(task());
    await renderPage();
    expect(screen.getByText(/No check-ins yet/)).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    getGrowerTask.mockResolvedValue(
      task({
        batches: [
          batch({ status: "QC_FAILED", payout: { amount: 50, status: "PENDING" }, checkIns: [checkIn({ qcResult: "REJECT", qcNotes: "Mould" , notes: "Looks fine"})] }),
          batch({ id: "b2", trayNumber: 2 }),
        ],
      })
    );
    const { container } = await renderPage();
    // The reviewer's and grower's own notes are data, not interface copy.
    expect(findUntranslated(container, { ignore: ["Mould", "Looks fine"] })).toEqual([]);
  });
});
