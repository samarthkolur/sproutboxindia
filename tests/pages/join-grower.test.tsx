import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }));
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const track = vi.hoisted(() => ({ trackSignUp: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => search.params,
  usePathname: () => "/join/grower",
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/gtag", () => track);
// The real map needs Leaflet and the network; this stub "picks" a fixed address.
vi.mock("@/components/onboarding/AddressMapPicker", () => ({
  AddressMapPicker: ({ onChange }: { onChange: (a: object) => void }) => (
    <button
      type="button"
      data-i18n-ignore
      onClick={() => onChange({ address: "12 Temple Road, Mysuru", city: "Mysuru", pincode: "570001", lat: 12.3, lng: 76.6 })}
    >
      Pick location
    </button>
  ),
}));

import GrowerJoinPage from "@/app/(marketing)/join/grower/page";
import { registrationPrefillKey } from "@/lib/registration-prefill";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  search.params = new URLSearchParams();
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
});
afterEach(() => vi.unstubAllGlobals());

const user = () => userEvent.setup();
const next = () => screen.getByRole("button", { name: /Continue/ });
// The wizard's own step heading (the summary panel has an h2 too).
const heading = () => document.querySelector("form h2")?.textContent;

async function fillPersonal(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText("Full Name"), "Asha Rao");
  await u.type(screen.getByLabelText("Email"), "asha@example.com");
  await u.type(screen.getByLabelText("Password"), "secret1");
  await u.type(screen.getByLabelText("Phone"), "9876543210");
}

/** Walk to the Review step with valid data. */
async function reachReview(u: ReturnType<typeof userEvent.setup>, opts: { fssai?: string } = {}) {
  await fillPersonal(u);
  await u.click(next());
  await u.click(screen.getByRole("button", { name: "Pick location" }));
  await u.click(next());
  await u.type(screen.getByLabelText("Area (sq ft)"), "100");
  await u.click(next());
  await u.click(next()); // kit: Starter preselected
  if (opts.fssai) await u.type(screen.getByLabelText(/FSSAI Registration Number/), opts.fssai);
  await u.click(next());
}

describe("/join/grower", () => {
  it("is a six-step wizard that includes the compliance step", () => {
    render(<GrowerJoinPage />);
    const steps = within(screen.getByRole("list", { name: "Progress" })).getAllByRole("listitem");
    expect(steps).toHaveLength(6);
    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Step 1 of 6")).toBeInTheDocument();
  });

  it("blocks a step with errors beside the fields and focuses the first", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await u.click(next());

    expect(heading()).toBe("Personal");
    expect(screen.getByLabelText("Full Name")).toHaveAccessibleDescription("Enter your full name.");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter your email address.");
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Enter a valid phone number, at least 7 digits.");
    await waitFor(() => expect(screen.getByLabelText("Full Name")).toHaveFocus());
  });

  it("needs a location from the map before leaving that step", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await fillPersonal(u);
    await u.click(next());
    await u.click(next());

    expect(heading()).toBe("Location");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a location on the map");
  });

  it("uses details from /register and does not ask for the password again", async () => {
    window.sessionStorage.setItem(
      registrationPrefillKey,
      JSON.stringify({ role: "GROWER", name: "Asha Rao", email: "asha@example.com", password: "secret1" })
    );
    render(<GrowerJoinPage />);
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue("asha@example.com"));
    expect(screen.getByLabelText("Full Name")).toHaveValue("Asha Rao");
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("moves focus to the new step heading so a screen reader announces it", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await fillPersonal(u);
    await u.click(next());
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Location" })).toHaveFocus());
  });

  it("advances when Enter is pressed in a field", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await fillPersonal(u);
    await u.type(screen.getByLabelText("Phone"), "{Enter}");
    expect(heading()).toBe("Location");
  });

  it("does not claim FSSAI is enforced or editable from a profile page that does not exist yet", async () => {
    const u = user();
    const { container } = render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: /Edit\s*Compliance/ }));
    expect(container.textContent).not.toMatch(/inactive/i);
    expect(container.textContent).not.toMatch(/from your profile/i);
  });

  it("shows a live summary of the chosen kit and what it can earn", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await fillPersonal(u);
    await u.click(next());
    await u.click(screen.getByRole("button", { name: "Pick location" }));
    await u.click(next());
    await u.type(screen.getByLabelText("Area (sq ft)"), "100");
    await u.click(next());

    const summary = screen.getByRole("complementary", { name: "Summary" });
    expect(summary).toHaveTextContent("₹250"); // 5 trays x ₹50
    await u.click(screen.getByRole("radio", { name: /Pro/ }));
    expect(summary).toHaveTextContent("₹2000"); // 40 trays x ₹50
    expect(summary).toHaveTextContent("₹2499");
  });

  it("FSSAI is optional: the wizard can be finished without it", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await reachReview(u);
    expect(heading()).toBe("Review");
    const row = screen.getByText("FSSAI number", { selector: "dt" }).parentElement!;
    expect(within(row).getByText("Not provided")).toBeInTheDocument();
  });

  it("rejects an FSSAI number that is not 14 digits", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await reachReview(u, { fssai: "12345" }).catch(() => {});
    expect(heading()).toBe("Compliance");
    expect(screen.getByLabelText(/FSSAI Registration Number/)).toHaveAccessibleDescription("An FSSAI number has 14 digits.");
  });

  it("submits the application, fires sign_up once, clears the prefill and goes to login", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await reachReview(u, { fssai: "1234 5678 9012 34" });
    await u.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login?registered=true"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/grower/register");
    expect(JSON.parse(init.body)).toMatchObject({
      name: "Asha Rao",
      email: "asha@example.com",
      password: "secret1",
      phone: "9876543210",
      city: "Mysuru",
      pincode: "570001",
      areaSize: 100,
      kit: "Starter",
      fssaiRegNumber: "12345678901234",
    });
    expect(track.trackSignUp).toHaveBeenCalledTimes(1);
    expect(track.trackSignUp).toHaveBeenCalledWith("grower", { city: "Mysuru", kit: "Starter", has_fssai: true });
    expect(window.sessionStorage.getItem(registrationPrefillKey)).toBeNull();
  });

  it("does not fire sign_up when the server rejects the application", async () => {
    const u = user();
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ success: false, error: "Something is wrong", code: "VALIDATION_ERROR" }) });
    render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something is wrong");
    expect(track.trackSignUp).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("sends a person whose email already exists back to fix it, with a way to sign in", async () => {
    const u = user();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "A user with this email already exists", code: "EMAIL_EXISTS" }),
    });
    render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A user with this email already exists");
    expect(heading()).toBe("Personal");
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/login");
    expect(track.trackSignUp).not.toHaveBeenCalled();
  });

  it("shows a generic error if the request itself fails", async () => {
    const u = user();
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  });

  it("locks the buttons while submitting", async () => {
    const u = user();
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));
    expect(screen.getByRole("button", { name: /Submitting/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Back/ })).toBeDisabled();
  });

  it("lets the person jump back from the review to fix one section", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: /Edit\s*Space/ }));
    expect(heading()).toBe("Space");
    expect(screen.getByLabelText("Area (sq ft)")).toHaveValue(100);
  });

  it("goes back a step, and from the first step links to /register", async () => {
    const u = user();
    render(<GrowerJoinPage />);
    expect(screen.getByRole("link", { name: /Register/ })).toHaveAttribute("href", "/register");
    await fillPersonal(u);
    await u.click(next());
    await u.click(screen.getByRole("button", { name: /Back/ }));
    expect(heading()).toBe("Personal");
  });

  it("has Kannada and Hindi for everything it says, on every step", async () => {
    const u = user();
    const { container } = render(<GrowerJoinPage />);
    const missing = new Set<string>();
    const check = () => findUntranslated(container, { ignore: ["Asha Rao", "Mysuru"] }).forEach((text) => missing.add(text));

    check();
    await u.click(next()); // errors on step 0
    check();
    await fillPersonal(u);
    await u.click(next());
    check();
    await u.click(next()); // location error
    check();
    await u.click(screen.getByRole("button", { name: "Pick location" }));
    await u.click(next());
    check();
    await u.click(next()); // area error
    check();
    await u.type(screen.getByLabelText("Area (sq ft)"), "100");
    await u.click(next());
    check();
    await u.type(screen.getByLabelText(/UPI ID/), "bad upi");
    await u.click(next()); // UPI error
    check();
    await u.clear(screen.getByLabelText(/UPI ID/));
    await u.click(next());
    check();
    await u.type(screen.getByLabelText(/FSSAI Registration Number/), "1");
    await u.click(next()); // fssai error
    check();
    await u.clear(screen.getByLabelText(/FSSAI Registration Number/));
    await u.click(next());
    check();

    expect(Array.from(missing).sort()).toEqual([]);
  }, 30000);
});
