"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { DARK_TOGGLE_ENABLED, useTheme } from "./ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  if (!DARK_TOGGLE_ENABLED) return null;

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      data-no-global-loading
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-panel/60 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
