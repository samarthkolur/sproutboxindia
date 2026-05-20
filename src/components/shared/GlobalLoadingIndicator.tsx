"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Sprout } from "lucide-react";

const ACTION_TIMEOUT_MS = 1400;
const SHOW_DELAY_MS = 80;

function shouldShowLoading(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  const interactive = target.closest<HTMLElement>(
    "a[href], button, [role='button'], input[type='submit']"
  );

  if (!interactive) return false;
  if (interactive.closest("[data-no-global-loading]")) return false;
  if (interactive.getAttribute("aria-disabled") === "true") return false;
  if ("disabled" in interactive && interactive.disabled) return false;

  const link = interactive.closest<HTMLAnchorElement>("a[href]");
  if (link) {
    const href = link.getAttribute("href") || "";
    const isModifiedClick =
      link.target === "_blank" ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:");

    return !isModifiedClick;
  }

  return true;
}

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };

    const show = () => {
      clearTimers();
      showTimer.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      hideTimer.current = setTimeout(() => setVisible(false), ACTION_TIMEOUT_MS);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (shouldShowLoading(event.target)) show();
    };

    const handleSubmit = () => show();

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-[#F8FAF7]/70 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="glass flex w-[min(92vw,360px)] flex-col items-center px-8 py-7 text-center shadow-2xl">
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sprout-800 text-white shadow-lg shadow-sprout-800/20">
          <Sprout className="h-7 w-7" />
          <Loader2 className="absolute -right-2 -top-2 h-6 w-6 animate-spin rounded-full bg-white p-1 text-sprout-800 shadow" />
        </div>
        <p className="text-base font-bold text-text-primary">Loading</p>
        <p className="mt-1 text-sm text-text-muted">Working on that click...</p>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-sprout-100">
          <div className="h-full w-1/2 animate-[loading-slide_0.9s_ease-in-out_infinite] rounded-full bg-sprout-700" />
        </div>
      </div>
    </div>
  );
}
