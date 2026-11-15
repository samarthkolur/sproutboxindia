import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, ThemeProvider, themeInitScript, useTheme } from "./ThemeProvider";

function Probe() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <>
      <p data-testid="theme">{theme}</p>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("dark")}>dark</button>
    </>
  );
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.className = "";
});

describe("ThemeProvider", () => {
  it("defaults to light", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("adopts the theme the init script already put on <html>", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("applies and persists a change", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    act(() => screen.getByText("dark").click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => screen.getByText("toggle").click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("still switches when storage is blocked", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    try {
      render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
      act(() => screen.getByText("dark").click());
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("throws a clear error when used outside the provider", () => {
    const spy = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Probe />)).toThrow("useTheme must be used inside ThemeProvider");
    } finally {
      console.error = spy;
    }
  });
});

describe("themeInitScript", () => {
  it("forces light while the dark toggle is disabled, even if dark was stored", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(themeInitScript)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("never throws when storage is unavailable", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    try {
      expect(() => new Function(themeInitScript)()).not.toThrow();
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
