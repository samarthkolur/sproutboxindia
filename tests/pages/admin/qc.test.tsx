import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast, processQCCheckIn } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  processQCCheckIn: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/actions/qc.actions", () => ({ processQCCheckIn: (...a: unknown[]) => processQCCheckIn(...a) }));

import { QCClient, type QueueItem } from "@/app/(dashboard)/admin/qc/QCClient";
import { BatchReview } from "@/app/(dashboard)/admin/qc/[batchId]/BatchReview";

const hours = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const checkIn = (id: string, day: number, over: Record<string, unknown> = {}) => ({
  id, day, imageTopUrl: `https://img.example/${id}-top.jpg`, imageSideUrl: `https://img.example/${id}-side.jpg`, notes: null, qcResult: null, qcNotes: null, createdAt: hours(5), ...over,
});
const item = (batchId: string, grower: string, crop: string, tray: number, over: Partial<QueueItem> = {}): QueueItem => ({
  batchId, trayNumber: tray, cropType: crop, growerName: grower, reviewable: true, day: 8, waitingSince: hours(30),
  checkIns: [checkIn(`${batchId}-c8`, 8, { notes: "Looks even to me" }), checkIn(`${batchId}-c6`, 6), checkIn(`${batchId}-c3`, 3)],
  ...over,
});

const queue = [item("b1", "Lakshmi Venkatesh", "sunflower", 4), item("b2", "Suresh Gowda", "radish", 2, { waitingSince: hours(3) }), item("b3", "Lakshmi Venkatesh", "radish", 7)];
const open = () => screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true")[0];

describe("admin QC review", () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    processQCCheckIn.mockReset().mockResolvedValue({ success: true });
  });

  it("shows the queue with grower, crop, tray, day and how long it has waited", () => {
    render(<QCClient queue={queue} />);
    expect(screen.getByText("3 trays waiting")).toBeInTheDocument();
    expect(open()).toHaveTextContent("Lakshmi Venkatesh");
    expect(open()).toHaveTextContent("Sunflower Shoots · Tray 4 · Day 8");
    expect(open()).toHaveTextContent("1 day ago");
  });

  it("opens the first tray's photos large, with the grower's note", () => {
    render(<QCClient queue={queue} />);
    expect(screen.getByAltText("Top view, day 8")).toHaveAttribute("src", "https://img.example/b1-c8-top.jpg");
    expect(screen.getByAltText("Side view, day 8")).toBeInTheDocument();
    expect(screen.getByText("Looks even to me")).toBeInTheDocument();
  });

  it("shows every check-in the tray has had, and switches photos by day", () => {
    render(<QCClient queue={queue} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Day 3", "Day 6", "Day 8"]);
    fireEvent.click(screen.getByRole("tab", { name: "Day 3" }));
    expect(screen.getByAltText("Top view, day 3")).toHaveAttribute("src", "https://img.example/b1-c3-top.jpg");
  });

  it("opens a photo in a lightbox that has a close button", () => {
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: "Enlarge top view" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close photo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("passes a tray for the latest check-in, with a record of who and what, and opens the next", async () => {
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: /Pass/ }));
    await waitFor(() => expect(processQCCheckIn).toHaveBeenCalledWith("b1-c8", "PASS", undefined));
    await waitFor(() => expect(open()).toHaveTextContent("Suresh Gowda"));
    expect(screen.getByText("2 trays waiting")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("will not reject without a reason, so the grower always learns what to fix", async () => {
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: /Reject/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a reason or write a note");
    expect(processQCCheckIn).not.toHaveBeenCalled();
  });

  it("sends the chosen reasons and note with a reject", async () => {
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: "Mould or fungus" }));
    fireEvent.click(screen.getByRole("button", { name: "Pale or yellow stems" }));
    fireEvent.change(screen.getByLabelText("Note to the grower"), { target: { value: "Left edge" } });
    fireEvent.click(screen.getByRole("button", { name: /Reject/ }));
    await waitFor(() => expect(processQCCheckIn).toHaveBeenCalledWith("b1-c8", "REJECT", "Mould or fungus, Pale or yellow stems. Left edge"));
    expect(toast.success).toHaveBeenCalledWith("Tray rejected", { description: "The grower has been sent your reason." });
  });

  it("flags a risk without removing the tray, and marks it in the queue", async () => {
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: /Flag as risk/ }));
    await waitFor(() => expect(processQCCheckIn).toHaveBeenCalledWith("b1-c8", "RISK", undefined));
    expect(await screen.findByText("Risk flagged")).toBeInTheDocument();
    expect(screen.getByText("3 trays waiting")).toBeInTheDocument();
  });

  it("keeps the tray and shows the error when the server refuses", async () => {
    processQCCheckIn.mockResolvedValue({ error: "This tray has already been reviewed" });
    render(<QCClient queue={queue} />);
    fireEvent.click(screen.getByRole("button", { name: /Pass/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This tray has already been reviewed"));
    expect(screen.getByText("3 trays waiting")).toBeInTheDocument();
  });

  it("decides with the keyboard, but not while typing a note", async () => {
    render(<QCClient queue={queue} />);
    fireEvent.change(screen.getByLabelText("Note to the grower"), { target: { value: "x" } });
    fireEvent.keyDown(screen.getByLabelText("Note to the grower"), { key: "p" });
    expect(processQCCheckIn).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "p" });
    // The note typed above goes with the verdict.
    await waitFor(() => expect(processQCCheckIn).toHaveBeenCalledWith("b1-c8", "PASS", "x"));
  });

  it("moves through the queue with J and K", () => {
    render(<QCClient queue={queue} />);
    fireEvent.keyDown(document.body, { key: "j" });
    expect(open()).toHaveTextContent("Suresh Gowda");
    fireEvent.keyDown(document.body, { key: "k" });
    expect(open()).toHaveTextContent("Sunflower Shoots · Tray 4");
    fireEvent.keyDown(document.body, { key: "k" });
    expect(open()).toHaveTextContent("Tray 7");
  });

  it("filters the queue by crop and grower", () => {
    render(<QCClient queue={queue} />);
    fireEvent.change(screen.getByLabelText("Crop"), { target: { value: "radish" } });
    expect(screen.getByText("2 trays waiting")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Grower"), { target: { value: "Suresh Gowda" } });
    expect(screen.getByText("1 tray waiting")).toBeInTheDocument();
  });

  it("links each tray to its own page", () => {
    render(<QCClient queue={queue} />);
    expect(screen.getByRole("link", { name: /Open this tray/ })).toHaveAttribute("href", "/admin/qc/b1");
  });

  it("has an empty state", () => {
    render(<QCClient queue={[]} />);
    expect(screen.getByText("The QC queue is clear")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<QCClient queue={queue} />);
    expect(findUntranslated(container, { ignore: ["Lakshmi Venkatesh", "Suresh Gowda", "Looks even to me"] })).toEqual([]);
  });
});

describe("the batch page's review", () => {
  const detail = (over: Record<string, unknown> = {}) => ({
    batchId: "cmbatch0001abcdef", trayNumber: 4, cropType: "sunflower", growerName: "Lakshmi Venkatesh", reviewable: true,
    checkIns: [checkIn("c8", 8), checkIn("c6", 6, { qcResult: "RISK", qcNotes: "Slightly pale" })], ...over,
  });

  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    processQCCheckIn.mockReset().mockResolvedValue({ success: true });
  });

  it("shows the full history and the verdict already given on an earlier day", () => {
    render(<BatchReview item={detail()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Day 6" }));
    expect(screen.getByText("Earlier review:")).toBeInTheDocument();
    expect(screen.getByText("Slightly pale")).toBeInTheDocument();
  });

  it("decides and refreshes the page", async () => {
    render(<BatchReview item={detail()} />);
    fireEvent.click(screen.getByRole("button", { name: /Pass/ }));
    await waitFor(() => expect(processQCCheckIn).toHaveBeenCalledWith("c8", "PASS", undefined));
    expect(refresh).toHaveBeenCalled();
  });

  it("offers no decision for a tray that has already been reviewed", () => {
    render(<BatchReview item={detail({ reviewable: false })} />);
    expect(screen.queryByRole("button", { name: /Pass/ })).not.toBeInTheDocument();
    expect(screen.getByText(/already been reviewed/)).toBeInTheDocument();
  });

  it("says so when a photo is missing, and when there are no check-ins", () => {
    const first = render(<BatchReview item={detail({ checkIns: [checkIn("c8", 8, { imageSideUrl: null })] })} />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
    first.unmount();
    render(<BatchReview item={detail({ checkIns: [] })} />);
    expect(screen.getByText("This tray has no check-ins yet.")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<BatchReview item={detail({ reviewable: false })} />);
    expect(findUntranslated(container, { ignore: ["Lakshmi Venkatesh", "Slightly pale"] })).toEqual([]);
  });
});
