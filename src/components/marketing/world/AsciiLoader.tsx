"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "=-+";
const LENGTH = 9;

// The loader: a short strip of characters that keeps shuffling while the 3D world
// downloads and compiles its shaders. It fades out when the world is ready.
// Decorative characters only, so there is nothing to translate (and the translator skips it).
export function AsciiLoader({ done }: { done: boolean }) {
  const [frame, setFrame] = useState("=".repeat(LENGTH)); // static on the server, so hydration matches
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      setFrame(Array.from({ length: LENGTH }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""));
    }, 90);
    return () => window.clearInterval(timer);
  }, [done]);

  // Take it out of the page once the fade has finished.
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setGone(true), 800);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-label="Loading page"
      className={cn(
        "absolute inset-0 z-20 grid place-items-center bg-canvas transition-opacity duration-700 motion-reduce:transition-none",
        done ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <p data-i18n-ignore aria-hidden="true" className="font-mono text-sm font-medium tracking-[0.2em] text-ink-soft">
        {frame}
      </p>
    </div>
  );
}
