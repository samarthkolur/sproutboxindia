import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CROP_CYCLE_DAYS, CROP_DISPLAY_NAMES, CROP_PRICE_PER_KG } from "@/lib/constants";
import { findUntranslated } from "@/test/translation";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }));
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const track = vi.hoisted(() => ({ trackSignUp: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => search.params,
  usePathname: () => "/join/restaurant",
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/gtag", () => track);
vi.mock("@/components/onboarding/AddressMapPicker", () => ({
  AddressMapPicker: ({ onChange }: { onChange: (a: object) => void }) => (
    <button
      type="button"
      data-i18n-ignore
      onClick={() => onChange({ address: "1 MG Road, Bengaluru", city: "Bengaluru", pincode: "560001", lat: 12.97, lng: 77.59 })}
    >
      Pick location
    </button>
  ),
}));

import RestaurantJoinPage from "@/app/(marketing)/join/restaurant/page";
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
const heading = () => document.querySelector("form h2")?.textContent;

async function fillBusiness(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText("Restaurant Name"), "Green Bowl");
  await u.type(screen.getByLabelText("Contact Name"), "Ravi Kumar");
  await u.type(screen.getByLabelText("Email"), "ravi@example.com");
  await u.type(screen.getByLabelText("Password"), "secret1");
  await u.type(screen.getByLabelText("Phone"), "9876543210");
}

async function reachCrops(u: ReturnType<typeof userEvent.setup>) {
  await fillBusiness(u);
  await u.click(next());
  await u.click(screen.getByRole("button", { name: "Pick location" }));
  await u.click(next());
}

async function reachReview(u: ReturnType<typeof userEvent.setup>) {
  await reachCrops(u);
  await u.click(screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES.sunflower) }));
  await u.click(screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES.radish) }));
  await u.click(next());
  await u.click(screen.getByRole("radio", { name: "Biweekly" }));
  await u.click(next());
}

describe("/join/restaurant", () => {
  it("is a five-step wizard with the map on its own step", () => {
    render(<RestaurantJoinPage />);
    const steps = within(screen.getByRole("list", { name: "Progress" })).getAllByRole("listitem");
    expect(steps).toHaveLength(5);
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
  });

  it("blocks the business step with errors beside each field", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await u.click(next());
    expect(heading()).toBe("Business");
    expect(screen.getByLabelText("Restaurant Name")).toHaveAccessibleDescription("Enter your restaurant's name.");
    expect(screen.getByLabelText("Contact Name")).toHaveAccessibleDescription("Enter your contact name.");
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Enter a valid phone number, at least 7 digits.");
    await waitFor(() => expect(screen.getByLabelText("Restaurant Name")).toHaveFocus());
  });

  it("checks the GST number only when one is given", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await fillBusiness(u);
    await u.type(screen.getByLabelText(/GST Number/), "22AAA");
    await u.click(next());
    expect(heading()).toBe("Business");
    expect(screen.getByLabelText(/GST Number/)).toHaveAccessibleDescription("A GST number has 15 characters.");
  });

  it("needs a location from the map", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await fillBusiness(u);
    await u.click(next());
    await u.click(next());
    expect(heading()).toBe("Location");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a location on the map");
  });

  it("uses details from /register and does not ask for the password again", async () => {
    window.sessionStorage.setItem(
      registrationPrefillKey,
      JSON.stringify({ role: "RESTAURANT", name: "Ravi Kumar", email: "ravi@example.com", password: "secret1" })
    );
    render(<RestaurantJoinPage />);
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue("ravi@example.com"));
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("offers every crop with its real price and grow time, and totals the choice in the summary", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await reachCrops(u);

    const sunflower = screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES.sunflower) }).closest("label")!;
    expect(sunflower).toHaveTextContent(`₹${CROP_PRICE_PER_KG.sunflower}/kg`);
    expect(sunflower).toHaveTextContent(`${CROP_CYCLE_DAYS.sunflower} days`);

    const summary = screen.getByRole("complementary", { name: "Summary" });
    expect(summary).toHaveTextContent("Pick the greens you use most");

    await u.click(screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES.sunflower) }));
    await u.click(screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES.radish) }));
    expect(summary).toHaveTextContent(CROP_DISPLAY_NAMES.sunflower);
    expect(summary).toHaveTextContent(CROP_DISPLAY_NAMES.radish);
    expect(summary).toHaveTextContent(`${CROP_CYCLE_DAYS.radish}–${CROP_CYCLE_DAYS.sunflower}`); // 7–9
    expect(summary).toHaveTextContent("You place each order yourself");
  });

  it("does not promise automatic repeat orders", async () => {
    const u = user();
    const { container } = render(<RestaurantJoinPage />);
    await reachCrops(u);
    expect(container.textContent).not.toMatch(/auto-?order|automatically/i);
  });

  it("submits business, location, crops and schedule, fires sign_up and goes to login", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login?registered=true"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/restaurant/register");
    expect(JSON.parse(init.body)).toMatchObject({
      businessName: "Green Bowl",
      name: "Ravi Kumar",
      email: "ravi@example.com",
      password: "secret1",
      phone: "9876543210",
      city: "Bengaluru",
      pincode: "560001",
      lat: 12.97,
      lng: 77.59,
      selectedCrops: ["sunflower", "radish"],
      deliveryFrequency: "biweekly",
    });
    expect(track.trackSignUp).toHaveBeenCalledTimes(1);
    expect(track.trackSignUp).toHaveBeenCalledWith("restaurant", {
      city: "Bengaluru",
      cuisine_type: undefined,
      crops_selected: 2,
      delivery_frequency: "biweekly",
    });
    expect(window.sessionStorage.getItem(registrationPrefillKey)).toBeNull();
  });

  it("lists the chosen crops on the review, and 'None selected' when there are none", async () => {
    const u = user();
    const { unmount } = render(<RestaurantJoinPage />);
    await reachReview(u);
    const reviewRow = () => within(document.querySelector("form")!).getByText("Crops", { selector: "dt" }).parentElement!;
    const row = reviewRow();
    expect(within(row).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      CROP_DISPLAY_NAMES.sunflower,
      CROP_DISPLAY_NAMES.radish,
    ]);
    unmount();

    const u2 = user();
    render(<RestaurantJoinPage />);
    await reachCrops(u2);
    await u2.click(next());
    await u2.click(next());
    expect(screen.getByText("None selected")).toBeInTheDocument();
  });

  it("sends a person whose email already exists back to fix it", async () => {
    const u = user();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "A user with this email already exists", code: "EMAIL_EXISTS" }),
    });
    render(<RestaurantJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A user with this email already exists");
    expect(heading()).toBe("Business");
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/login");
    expect(track.trackSignUp).not.toHaveBeenCalled();
  });

  it("lets the person jump back from the review to change the schedule", async () => {
    const u = user();
    render(<RestaurantJoinPage />);
    await reachReview(u);
    await u.click(screen.getByRole("button", { name: /Edit\s*Schedule/ }));
    expect(heading()).toBe("Schedule");
    expect(screen.getByRole("radio", { name: "Biweekly" })).toBeChecked();
  });

  it("has Kannada and Hindi for everything it says, on every step", async () => {
    const u = user();
    const { container } = render(<RestaurantJoinPage />);
    const missing = new Set<string>();
    const ignore = ["Green Bowl", "Ravi Kumar", "Bengaluru"];
    const check = () => findUntranslated(container, { ignore }).forEach((text) => missing.add(text));

    check();
    await u.click(next()); // errors
    check();
    await fillBusiness(u);
    await u.type(screen.getByLabelText(/GST Number/), "22AAA");
    await u.click(next()); // GST error
    check();
    await u.clear(screen.getByLabelText(/GST Number/));
    await u.click(next());
    check();
    await u.click(next()); // location error
    check();
    await u.click(screen.getByRole("button", { name: "Pick location" }));
    await u.click(next());
    check();
    await u.click(screen.getByRole("checkbox", { name: new RegExp(CROP_DISPLAY_NAMES["pea-shoots"]) }));
    check();
    await u.click(next());
    check();
    await u.click(next());
    check();
    expect(Array.from(missing).sort()).toEqual([]);
  }, 30000);
});
