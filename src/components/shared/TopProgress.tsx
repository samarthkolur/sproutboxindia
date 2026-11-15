"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MAX_VISIBLE_MS = 8000;

// Thin bar at the top of the viewport. Starts when an internal link is
// clicked and ends when the route changes. Replaces the old full-screen
// overlay that blocked the page on every click.
export function TopProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActive(false);
    if (timeout.current) clearTimeout(timeout.current);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (link.closest("[data-no-global-loading]")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setActive(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-brand/15"
    >
      <div className="h-full w-1/3 animate-progress-sweep bg-brand motion-reduce:animate-none" />
    </div>
  );
}
