import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, delivered, feedback, order } from "@/test/restaurant-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const getRestaurantOrder = vi.fn();
vi.mock("@/lib/restaurant-data", () => ({ getRestaurantOrder: (...a: unknown[]) => getRestaurantOrder(...a) }));

import RestaurantFeedbackPage from "@/app/(dashboard)/restaurant/feedback/[orderId]/page";

const fetchMock = vi.fn();
const renderPage = async () => render(await RestaurantFeedbackPage({ params: { orderId: "cmdelivered01abcd" } }));
const sent = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("restaurant feedback", () => {
  beforeEach(() => {
    getRestaurantOrder.mockReset();
    refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("reads the order through the signed-in user and is a 404 for someone else's", async () => {
    getRestaurantOrder.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getRestaurantOrder).toHaveBeenCalledWith("user-1", "cmdelivered01abcd");
  });

  it("shows the order and when it was delivered", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    expect(screen.getByText("Sunflower Shoots, 3 kg")).toBeInTheDocument();
    expect(screen.getByText("Delivered on")).toBeInTheDocument();
  });

  it("only takes feedback for a delivered order", async () => {
    getRestaurantOrder.mockResolvedValue(order());
    await renderPage();
    expect(screen.getByText(/This order is not delivered yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send feedback" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the order" })).toHaveAttribute("href", "/restaurant/orders/cmorder0001abcdef");
  });

  it("needs a star rating before it sends anything", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByText("Choose a star rating first.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the rating, with the chosen tags on the first line of the notes", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Freshness" }));
    fireEvent.click(screen.getByRole("button", { name: "On time" }));
    fireEvent.change(screen.getByLabelText(/Anything else/), { target: { value: "Crisp and sweet" } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/restaurant/feedback");
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(sent()).toEqual({ orderId: "cmdelivered01abcd", rating: 5, notes: "Tags: Freshness, On time\nCrisp and sweet" });
  });

  it("thanks the restaurant and links back to its orders", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByText("Thank you for your feedback")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to my orders" })).toHaveAttribute("href", "/restaurant/orders");
    expect(refresh).toHaveBeenCalled();
  });

  it("sends no notes at all when there is nothing to say", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sent().notes).toBeUndefined();
  });

  it("shows the server's message when sending fails, and keeps what was typed", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "You can rate an order once it has been delivered" }) });
    getRestaurantOrder.mockResolvedValue(delivered());
    await renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
    fireEvent.change(screen.getByLabelText(/Anything else/), { target: { value: "Late" } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("once it has been delivered");
    expect(screen.getByLabelText(/Anything else/)).toHaveValue("Late");
  });

  it("opens an already-rated order with the feedback filled in, and updates it", async () => {
    getRestaurantOrder.mockResolvedValue(delivered({ feedback: feedback({ rating: 4, notes: "Tags: Quality, Packaging\nVery fresh", createdAt: daysFromNow(-4) }) }));
    await renderPage();
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Quality" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Freshness" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText(/Anything else/)).toHaveValue("Very fresh");
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Update feedback" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sent()).toMatchObject({ orderId: "cmdelivered01abcd", rating: 5, notes: "Tags: Quality, Packaging\nVery fresh" });
  });

  it("has Kannada and Hindi for everything it says, before and after sending", async () => {
    getRestaurantOrder.mockResolvedValue(delivered());
    const { container } = await renderPage();
    expect(findUntranslated(container)).toEqual([]);
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    await screen.findByText("Thank you for your feedback");
    expect(findUntranslated(container)).toEqual([]);
  });
});
