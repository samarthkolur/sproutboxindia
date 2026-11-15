"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { chooseTier, forcedTier } from "@/lib/quality-tier";
import type { FrameInfo, World } from "./engine/createWorld";

/** Which moment of the story a still frame shows (reduced motion): a grown field. */
export const STILL_PROGRESS = 0.97;

interface WorldCanvasProps {
  /** Where the page wants the journey to be; the world eases towards it. */
  targetRef: MutableRefObject<number>;
  reducedMotion: boolean;
  onFrame?: (frame: FrameInfo) => void;
  onReady: () => void;
  onFail: () => void;
  className?: string;
}

function webgl2Available() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

// Owns the WebGL canvas. three.js loads with a dynamic import after the page has
// painted, so it never delays the headline and never runs on the server.
export function WorldCanvas({ targetRef, reducedMotion, onFrame, onReady, onFail, className }: WorldCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onFrame, onReady, onFail });
  callbacks.current = { onFrame, onReady, onFail };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // A fresh canvas per mount: one whose GPU context was released cannot be reused
    // (React Strict Mode mounts, unmounts and mounts again in development).
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    let disposed = false;
    let world: World | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;

    (async () => {
      try {
        if (!webgl2Available()) throw new Error("WebGL 2 is not available");
        const { createWorld } = await import("./engine/createWorld");
        if (disposed) return;

        const tier =
          forcedTier(window.location.search) ??
          chooseTier({
            webgl2: true,
            deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            devicePixelRatio: window.devicePixelRatio,
            width: window.innerWidth,
            touch: window.matchMedia("(pointer: coarse)").matches,
          });

        const created = await createWorld(canvas, {
          tier,
          reducedMotion,
          getTarget: () => targetRef.current,
          onFrame: (frame) => callbacks.current.onFrame?.(frame),
          onContextLost: () => !disposed && callbacks.current.onFail(),
        });
        if (disposed) {
          created.dispose();
          return;
        }
        world = created;

        const fit = () => {
          const { width, height } = host.getBoundingClientRect();
          world?.resize(width, height);
          if (reducedMotion) world?.renderStill(STILL_PROGRESS);
        };
        fit();
        resizeObserver = new ResizeObserver(fit);
        resizeObserver.observe(host);

        if (reducedMotion) {
          world.renderStill(STILL_PROGRESS);
        } else {
          world.renderStill(targetRef.current); // first frame straight away
          // Only run the loop while the journey is on screen.
          visibilityObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) world?.start();
            else world?.stop();
          });
          visibilityObserver.observe(host);
        }
        callbacks.current.onReady();
      } catch {
        // No WebGL 2, or the GPU refused: the page keeps its static illustration.
        if (!disposed) callbacks.current.onFail();
      }
    })();

    return () => {
      disposed = true;
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      world?.dispose();
      canvas.remove();
    };
  }, [reducedMotion, targetRef]);

  return <div ref={hostRef} className={className} />;
}
