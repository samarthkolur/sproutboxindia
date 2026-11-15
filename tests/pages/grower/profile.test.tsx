import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, grower } from "@/test/grower-fixtures";
import { findUntranslated } from "@/test/translation";

const refresh = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

const getGrowerProfile = vi.fn();
vi.mock("@/lib/grower-data", () => ({ getGrowerProfile: (...args: unknown[]) => getGrowerProfile(...args) }));

import GrowerProfilePage from "@/app/(dashboard)/grower/profile/page";

const fetchMock = vi.fn();

function profile(growerOverrides: Record<string, unknown> = {}, scoredTrays = 4) {
  return { grower: grower(growerOverrides), scoredTrays };
}
async function renderPage() {
  return render(await GrowerProfilePage());
}
const panel = (title: string) => screen.getByRole("heading", { name: title }).closest(".panel") as HTMLElement;

describe("grower profile", () => {
  beforeEach(() => {
    getGrowerProfile.mockReset();
    refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("scopes the read to the signed-in user", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    expect(getGrowerProfile).toHaveBeenCalledWith("user-1");
  });

  it("groups the details into panels instead of eleven identical rows", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    for (const title of ["Account", "Contact and address", "Payout details", "Space and kit", "FSSAI registration", "Performance"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(within(panel("Account")).getByText("asha@example.com")).toBeInTheDocument();
    expect(within(panel("Contact and address")).getByText("Bengaluru")).toBeInTheDocument();
    expect(within(panel("Space and kit")).getByText("Your kit holds 5 trays.")).toBeInTheDocument();
  });

  it("hides the bank account until the grower shows it", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    const payout = panel("Payout details");
    expect(within(payout).queryByText("123456789012")).not.toBeInTheDocument();
    expect(within(payout).getByText("••••••••9012")).toBeInTheDocument();
    fireEvent.click(within(payout).getByRole("button", { name: "Show Bank account number" }));
    expect(within(payout).getByText("123456789012")).toBeInTheDocument();
    fireEvent.click(within(payout).getByRole("button", { name: "Hide Bank account number" }));
    expect(within(payout).queryByText("123456789012")).not.toBeInTheDocument();
  });

  it("says 'Not added' for an empty field", async () => {
    getGrowerProfile.mockResolvedValue(profile({ upiId: null, bankAccount: null, bankIFSC: null }));
    await renderPage();
    expect(within(panel("Payout details")).getAllByText("Not added")).toHaveLength(3);
  });

  it("edits one group, validates it, and saves only that group", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    const contact = panel("Contact and address");
    fireEvent.click(within(contact).getByRole("button", { name: /Edit/ }));

    fireEvent.change(within(contact).getByLabelText("PIN code"), { target: { value: "56" } });
    fireEvent.click(within(contact).getByRole("button", { name: "Save changes" }));
    expect(await within(contact).findByText("A PIN code has 6 digits.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(within(contact).getByLabelText("PIN code"), { target: { value: "560002" } });
    fireEvent.click(within(contact).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/grower/profile");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ phone: "+919876543210", address: "12 MG Road", city: "Bengaluru", pincode: "560002" });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the server's message when saving fails, and keeps the form open", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Invalid request" }) });
    await renderPage();
    const payout = panel("Payout details");
    fireEvent.click(within(payout).getByRole("button", { name: /Edit/ }));
    fireEvent.click(within(payout).getByRole("button", { name: "Save changes" }));
    expect(await within(payout).findByRole("alert")).toHaveTextContent("Invalid request");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("cancels an edit without saving", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    const contact = panel("Contact and address");
    fireEvent.click(within(contact).getByRole("button", { name: /Edit/ }));
    fireEvent.click(within(contact).getByRole("button", { name: "Cancel" }));
    expect(within(contact).queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets a grower submit an FSSAI number when none is on file", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    const fssai = panel("FSSAI registration");
    expect(within(fssai).getByText("No FSSAI")).toBeInTheDocument();
    fireEvent.click(within(fssai).getByRole("button", { name: /Edit/ }));
    fireEvent.change(within(fssai).getByLabelText("FSSAI registration number"), { target: { value: "1234 5678 9012 34" } });
    fireEvent.click(within(fssai).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ fssaiRegNumber: "12345678901234" });
  });

  it("shows a number that is waiting for verification", async () => {
    getGrowerProfile.mockResolvedValue(profile({ fssaiRegNumber: "12345678901234" }));
    await renderPage();
    const fssai = panel("FSSAI registration");
    expect(within(fssai).getByText("FSSAI pending")).toBeInTheDocument();
    expect(within(fssai).getByRole("button", { name: /Edit/ })).toBeInTheDocument();
  });

  it("locks a verified number", async () => {
    getGrowerProfile.mockResolvedValue(profile({ fssaiRegNumber: "12345678901234", fssaiVerifiedAt: daysFromNow(-5) }));
    await renderPage();
    const fssai = panel("FSSAI registration");
    expect(within(fssai).getByText("FSSAI verified")).toBeInTheDocument();
    expect(within(fssai).queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(within(fssai).getByText("This number is verified. Contact the team if it needs to change.")).toBeInTheDocument();
  });

  it("shows the three scores once trays have finished", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    await renderPage();
    const performance = panel("Performance");
    expect(within(performance).getByText("80%")).toBeInTheDocument(); // yield
    expect(within(performance).getByText("92%")).toBeInTheDocument(); // quality
    expect(within(performance).getByText("70%")).toBeInTheDocument(); // timing
    expect(within(performance).getByText("Harvest weight vs expected")).toBeInTheDocument();
  });

  it("does not present default scores as results for a new grower", async () => {
    getGrowerProfile.mockResolvedValue(profile({ yieldScore: 0.5, qualityScore: 0.5, timelinessScore: 0.5 }, 0));
    await renderPage();
    const performance = panel("Performance");
    expect(within(performance).queryByText("50%")).not.toBeInTheDocument();
    expect(within(performance).getAllByText("—")).toHaveLength(3);
    expect(within(performance).getByText("Scores appear after your first finished tray.")).toBeInTheDocument();
  });

  it("handles a signed-in user with no grower profile", async () => {
    getGrowerProfile.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText("No grower profile found")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says, in view and edit mode", async () => {
    getGrowerProfile.mockResolvedValue(profile());
    const { container } = await renderPage();
    // Account details and the grower's own address are data, not interface copy.
    const data = ["Asha Rao", "asha@example.com", "12 MG Road", "Bengaluru", "asha@upi", "HDFC0001234", "560001", "+919876543210"];
    expect(findUntranslated(container, { ignore: data })).toEqual([]);
    fireEvent.click(within(panel("Contact and address")).getByRole("button", { name: /Edit/ }));
    fireEvent.click(within(panel("FSSAI registration")).getByRole("button", { name: /Edit/ }));
    expect(findUntranslated(container, { ignore: data })).toEqual([]);
  });
});
