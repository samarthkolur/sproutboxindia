import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast } = vi.hoisted(() => ({ refresh: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));

import { AllocateClient, type AllocatablePlan } from "@/app/(dashboard)/admin/allocate/AllocateClient";
import type { GrowerInput } from "@/lib/admin";

const day = 86400000;
const plan = (id: string, name: string, trays: number, daysAway: number): AllocatablePlan => ({
  id,
  totalTrays: trays,
  bufferTrays: Math.ceil(trays / 5),
  sowDate: new Date(Date.now() + (daysAway - 11) * day),
  harvestDate: new Date(Date.now() + (daysAway - 1) * day),
  order: { cropType: "sunflower", quantityKg: 3, deliveryDate: new Date(Date.now() + daysAway * day), restaurant: { businessName: name, city: "Bengaluru", lat: 12.9345, lng: 77.6193 } },
});
const grower = (id: string, over: Partial<GrowerInput> = {}): GrowerInput => ({
  id, name: id, city: "Bengaluru", kitSize: 15, activeTrays: 0, compositeScore: 0.8, lat: 12.9352, lng: 77.6245, fssaiVerified: false, ...over,
});

const plans = [plan("cmplan01abcdef", "The Green Bowl", 19, 8), plan("cmplan02abcdef", "Fresh Fare Kitchen", 10, 20)];
const growers = [grower("Lakshmi", { kitSize: 15, compositeScore: 0.95, fssaiVerified: true }), grower("Suresh", { kitSize: 15, compositeScore: 0.85 }), grower("Anitha", { kitSize: 5, compositeScore: 0.7, city: "Mysuru", lat: 12.3, lng: 76.65 })];

const input = (name: string) => screen.getByLabelText(`Trays for ${name}`) as HTMLInputElement;
const send = () => screen.getByRole("button", { name: "Send tasks to growers" });
const fetchMock = vi.fn();

describe("admin allocate", () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lists the plans nearest delivery first and opens the first", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    expect(screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"))[0]).toHaveTextContent("The Green Bowl");
    expect(screen.getByRole("heading", { name: "The Green Bowl" })).toBeInTheDocument();
    expect(screen.getByText("19 (4 buffer)")).toBeInTheDocument();
  });

  it("starts from a proposed split that adds up to the plan and is ready to send", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    const total = ["Lakshmi", "Suresh", "Anitha"].reduce((sum, n) => sum + Number(input(n).value), 0);
    expect(total).toBe(19);
    expect(screen.getByText("19 of 19 trays")).toBeInTheDocument();
    expect(screen.getByText("Ready to send.")).toBeInTheDocument();
    expect(send()).toBeEnabled();
  });

  it("shows each grower's free room, from trays already growing", () => {
    render(<AllocateClient plans={plans} growers={[grower("Lakshmi", { kitSize: 15, activeTrays: 12 }), grower("Suresh")]} />);
    expect(screen.getByText("3 of 15 trays free")).toBeInTheDocument();
    expect(screen.getByText("15 of 15 trays free")).toBeInTheDocument();
  });

  it("warns and blocks when a grower is given more than their kit holds", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.change(input("Anitha"), { target: { value: "9" } });
    expect(screen.getByText("Only room for 5")).toBeInTheDocument();
    expect(screen.getByText("Someone has more trays than their kit holds.")).toBeInTheDocument();
    expect(send()).toBeDisabled();
  });

  it("blocks sending until every tray has a grower, and says how many are left", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    for (const n of ["Lakshmi", "Suresh", "Anitha"]) fireEvent.change(input(n), { target: { value: "0" } });
    fireEvent.change(input("Lakshmi"), { target: { value: "10" } });
    expect(screen.getByText("9 trays still need a grower.")).toBeInTheDocument();
    expect(send()).toBeDisabled();
  });

  it("blocks sending too many trays", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    for (const n of ["Lakshmi", "Suresh", "Anitha"]) fireEvent.change(input(n), { target: { value: "0" } });
    fireEvent.change(input("Lakshmi"), { target: { value: "15" } });
    fireEvent.change(input("Suresh"), { target: { value: "5" } });
    expect(screen.getByText("1 trays too many.")).toBeInTheDocument();
    expect(send()).toBeDisabled();
  });

  it("re-proposes the split with Auto-allocate", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.change(input("Lakshmi"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Auto-allocate" }));
    expect(screen.getByText("19 of 19 trays")).toBeInTheDocument();
  });

  it("tags the nearest grower, and shows the distance", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    const rows = screen.getAllByRole("listitem").filter((li) => li.querySelector("input[type=number]"));
    expect(within(rows.find((r) => r.textContent?.includes("Lakshmi"))!).getByText("Nearest")).toBeInTheDocument();
    expect(screen.getAllByText("Nearest")).toHaveLength(1);
    expect(screen.getByText(/Mysuru, \d+\.\d km/)).toBeInTheDocument();
  });

  it("filters growers by name, city and FSSAI", () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.change(screen.getByLabelText("Search growers"), { target: { value: "sur" } });
    expect(screen.queryByLabelText("Trays for Lakshmi")).not.toBeInTheDocument();
    expect(input("Suresh")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search growers"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Mysuru" } });
    expect(screen.queryByLabelText("Trays for Suresh")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "all" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "FSSAI verified only" }));
    expect(screen.queryByLabelText("Trays for Suresh")).not.toBeInTheDocument();
    expect(input("Lakshmi")).toBeInTheDocument();
  });

  it("sends the allocations, skips growers with none, and moves on to the next plan", async () => {
    render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.click(send());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/allocate");
    const body = JSON.parse(init.body);
    expect(body.planId).toBe("cmplan01abcdef");
    expect(body.allocations.every((a: { trayCount: number }) => a.trayCount > 0)).toBe(true);
    expect(body.allocations.reduce((s: number, a: { trayCount: number }) => s + a.trayCount, 0)).toBe(19);
    expect(await screen.findByRole("heading", { name: "Fresh Fare Kitchen" })).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the server's message and keeps the plan when sending fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: "Production plan is not in DRAFT status" }) });
    render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.click(send());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Production plan is not in DRAFT status"));
    expect(screen.getByRole("heading", { name: "The Green Bowl" })).toBeInTheDocument();
  });

  it("has an empty state that points to the Demand engine", () => {
    render(<AllocateClient plans={[]} growers={growers} />);
    expect(screen.getByRole("link", { name: "Open the Demand engine" })).toHaveAttribute("href", "/admin/demand");
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<AllocateClient plans={plans} growers={growers} />);
    fireEvent.change(input("Anitha"), { target: { value: "9" } });
    // Names and places are data, not interface copy.
    expect(findUntranslated(container, { ignore: ["The Green Bowl", "Fresh Fare Kitchen", "Lakshmi", "Suresh", "Anitha", "Bengaluru", "Mysuru"] })).toEqual([]);
  });
});
