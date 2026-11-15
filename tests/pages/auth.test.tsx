import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }));
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const signInMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => search.params,
  usePathname: () => "/login",
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("next-auth/react", () => ({ signIn: signInMock }));
vi.mock("@/actions/auth.actions", () => ({ performSignOut: signOutMock }));

import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import SignOutPage from "@/app/(auth)/signout/page";
import { readRegistrationPrefill } from "@/lib/registration-prefill";

beforeEach(() => {
  vi.clearAllMocks();
  search.params = new URLSearchParams();
  window.sessionStorage.clear();
});

describe("/login", () => {
  async function submit(email = "a@b.co", password = "secret1") {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), password);
    await user.click(screen.getByRole("button", { name: "Sign In" }));
  }

  it("signs in with the credentials and goes to the dashboard", async () => {
    signInMock.mockResolvedValue({ error: undefined });
    render(<LoginPage />);
    await submit();

    expect(signInMock).toHaveBeenCalledWith("credentials", { email: "a@b.co", password: "secret1", redirect: false });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("returns to the page the visitor was trying to reach", async () => {
    search.params = new URLSearchParams("callbackUrl=/grower/tasks");
    signInMock.mockResolvedValue({});
    render(<LoginPage />);
    await submit();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/grower/tasks"));
  });

  it("does not follow a callback to another site", async () => {
    search.params = new URLSearchParams("callbackUrl=https://evil.example");
    signInMock.mockResolvedValue({});
    render(<LoginPage />);
    await submit();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("explains a wrong password and what to do, and stays on the page", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    render(<LoginPage />);
    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect. Check them and try again.");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("shows a generic error if the request itself fails", async () => {
    signInMock.mockRejectedValue(new Error("network"));
    render(<LoginPage />);
    await submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  });

  it("disables the button while signing in", async () => {
    let finish: (value: object) => void = () => {};
    signInMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<LoginPage />);
    await submit();
    expect(screen.getByRole("button", { name: /Signing in/ })).toBeDisabled();
    finish({});
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled());
  });

  it("confirms a new account when sent here after joining", () => {
    search.params = new URLSearchParams("registered=true");
    render(<LoginPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Account created. Sign in to continue.");
  });

  it("shows no confirmation on a normal visit", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("links to registration", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  });

  it("has Kannada and Hindi for everything it says", () => {
    search.params = new URLSearchParams("registered=true");
    const { container } = render(<LoginPage />);
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("/register", () => {
  async function fill(user: ReturnType<typeof userEvent.setup>, values: Partial<Record<string, string>> = {}) {
    const v = { name: "Asha Rao", email: "asha@example.com", password: "secret1", confirm: "secret1", ...values };
    await user.type(screen.getByLabelText("Full Name"), v.name);
    await user.type(screen.getByLabelText("Email"), v.email);
    await user.type(screen.getByLabelText("Password"), v.password);
    await user.type(screen.getByLabelText("Confirm"), v.confirm);
  }

  it("offers grower and restaurant as two choices, and says what happens next", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    expect(screen.getByRole("radio", { name: /Grower/ })).toBeChecked();
    expect(screen.getByText(/tell us about your space and kit/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Restaurant/ }));
    expect(screen.getByText(/tell us about your kitchen/)).toBeInTheDocument();
  });

  it("hands the details to the grower wizard without creating an account yet", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(router.push).toHaveBeenCalledWith("/join/grower");
    expect(readRegistrationPrefill("GROWER")).toMatchObject({ name: "Asha Rao", email: "asha@example.com", password: "secret1" });
  });

  it("hands restaurants to their own wizard", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.click(screen.getByRole("radio", { name: /Restaurant/ }));
    await fill(user);
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(router.push).toHaveBeenCalledWith("/join/restaurant");
    expect(readRegistrationPrefill("RESTAURANT")).not.toBeNull();
    expect(readRegistrationPrefill("GROWER")).toBeNull();
  });

  it("shows an error beside each field that needs fixing and moves focus to the first", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByLabelText("Full Name")).toHaveAccessibleDescription("Enter your full name.");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter your email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Password must be at least 6 characters.");
    expect(screen.getByLabelText("Confirm")).toHaveAccessibleDescription("Re-enter your password.");
    expect(screen.getByLabelText("Full Name")).toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("rejects a bad email, a short password and a mismatch", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await fill(user, { email: "not-an-email", password: "abc", confirm: "abd" });
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Password must be at least 6 characters.");
    expect(screen.getByLabelText("Confirm")).toHaveAccessibleDescription("Passwords do not match.");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("clears a field's error as soon as the person starts fixing it", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByLabelText("Full Name")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Full Name"), "A");
    expect(screen.getByLabelText("Full Name")).not.toHaveAttribute("aria-invalid");
  });

  it("has Kannada and Hindi for everything it says, including errors", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(findUntranslated(container)).toEqual([]);

    await user.click(screen.getByRole("radio", { name: /Restaurant/ }));
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.type(screen.getByLabelText("Password"), "abc");
    await user.type(screen.getByLabelText("Confirm"), "abd");
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("/signout", () => {
  it("asks before signing out, with a neutral confirm button", () => {
    render(<SignOutPage />);
    expect(screen.getByRole("heading", { name: "Sign Out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, Sign Out" }).className).not.toMatch(/red|risk|destructive/);
  });

  it("signs out on confirm and locks the buttons meanwhile", async () => {
    signOutMock.mockReturnValue(new Promise(() => {}));
    render(<SignOutPage />);
    fireEvent.click(screen.getByRole("button", { name: "Yes, Sign Out" }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("button", { name: /Signing out/ })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("goes back on cancel when there is history, otherwise to the dashboard", () => {
    const { unmount } = render(<SignOutPage />);
    Object.defineProperty(window.history, "length", { value: 3, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(router.back).toHaveBeenCalledTimes(1);
    unmount();

    render(<SignOutPage />);
    Object.defineProperty(window.history, "length", { value: 1, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<SignOutPage />);
    expect(findUntranslated(container)).toEqual([]);
  });
});
