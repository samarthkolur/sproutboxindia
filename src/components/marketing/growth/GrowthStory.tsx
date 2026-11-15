"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROW_DAYS, STAGES, clamp01, stageAt } from "@/lib/plant-growth";
import { cn } from "@/lib/utils";
import { AsciiLoader } from "../world/AsciiLoader";
import type { FrameInfo } from "../world/engine/createWorld";
import { WorldCanvas } from "../world/WorldCanvas";
import { GrowthFallback } from "./GrowthFallback";
import { STAGE_COPY } from "./stages";
import { usePrefersReducedMotion } from "./use-reduced-motion";

// How tall the scroll track is. The animation plays as the visitor scrolls through it.
const TRACK_VH = 520;

type SceneStatus = "loading" | "ready" | "failed";

function Ctas() {
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="rounded-full">
        <Link href="/join/grower">
          Join as Grower
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-full border-hairline bg-panel/70">
        <Link href="/join/restaurant">Partner as Restaurant</Link>
      </Button>
    </div>
  );
}

function StageCard({ index, active, reduced }: { index: number; active: boolean; reduced: boolean }) {
  const stage = STAGES[index];
  const copy = STAGE_COPY[stage.id];
  const isHero = stage.id === "sow";
  const isHarvest = stage.id === "harvest";
  const visible = active || reduced;

  return (
    <div
      // Inactive cards stay in the DOM (the whole story is readable), but cannot be focused.
      {...(visible ? {} : ({ inert: "" } as object))}
      className={cn(
        "col-start-1 row-start-1 transition-[opacity,transform] duration-500 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        reduced && "row-auto"
      )}
    >
      {isHero ? (
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-leaf-soft px-3.5 py-1.5 text-sm font-medium text-ink">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-leaf" />
            {copy.kicker}
          </span>
          <h1 className="mt-5 text-4xl font-light leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-4 hidden max-w-lg text-lg text-ink-soft sm:block">{copy.body}</p>
          <Ctas />
          <p className="mt-7 hidden items-center gap-2 text-sm text-ink-muted sm:flex">
            <ChevronsDown className="h-4 w-4 motion-safe:animate-bounce" aria-hidden="true" />
            Scroll to watch a seed grow
          </p>
        </div>
      ) : (
        <div className="panel max-w-md !bg-panel-solid/90 p-6 sm:p-7">
          <p className="text-micro font-medium uppercase tracking-wider text-ink-muted">{copy.kicker}</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{copy.title}</h2>
          <p className="mt-3 text-base text-ink-soft">{copy.body}</p>
          {copy.detail ? <p className="mt-2 text-sm text-ink-muted">{copy.detail}</p> : null}
          {isHarvest ? <Ctas /> : null}
        </div>
      )}
    </div>
  );
}

export function GrowthStory() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);
  const [day, setDay] = useState(1);
  const [status, setStatus] = useState<SceneStatus>("loading");

  // Scrolling through the track sets the target progress (0 to 1).
  useEffect(() => {
    if (reduced) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? clamp01(-rect.top / distance) : 0;
      progressRef.current = progress;
      const next = stageAt(progress);
      setStage((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  // Follow the (eased) animation: the day counter and the ruler marker.
  const onFrame = useCallback((frame: FrameInfo) => {
    setDay(Math.round(frame.day));
    if (markerRef.current) markerRef.current.style.top = `${frame.progress * 100}%`;
  }, []);

  const failed = status === "failed";
  const activeStage = reduced ? STAGES.length - 1 : stage;

  return (
    <section
      ref={sectionRef}
      aria-label="From seed to harvest"
      // Starts under the floating nav (h-14), so the stage is a true full screen at the top of the page.
      className="relative -mt-14"
      style={reduced ? undefined : { height: `${TRACK_VH}vh` }}
    >
      <a
        href="/#how-it-works"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-ink"
      >
        Skip the growing animation
      </a>

      <div className={cn("overflow-hidden", reduced ? "relative min-h-[88vh]" : "sticky top-0 h-screen")}>
        {/* The static illustration is only for when the 3D world cannot run. */}
        {failed && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[8%] mx-auto h-[48%] max-w-md sm:inset-y-0 sm:left-auto sm:right-[3%] sm:top-0 sm:h-full sm:max-w-[48%] sm:p-10"
          >
            <GrowthFallback />
          </div>
        )}

        {!failed && (
          <WorldCanvas
            targetRef={progressRef}
            reducedMotion={reduced}
            onFrame={onFrame}
            onReady={() => setStatus("ready")}
            onFail={() => setStatus("failed")}
            className="absolute inset-0"
          />
        )}

        {!failed && <AsciiLoader done={status === "ready"} />}

        {/* Day counter and ruler */}
        {!reduced && (
          <>
            <p
              className="pointer-events-none absolute right-4 top-24 rounded-full bg-panel-solid/85 px-3.5 py-1.5 text-sm font-medium tabular-nums text-ink shadow-panel sm:right-6"
              aria-hidden="true"
            >
              {`Day ${day} of ${GROW_DAYS}`}
            </p>
            <div aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 hidden h-56 w-4 -translate-y-1/2 lg:block">
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hairline" />
              {Array.from({ length: GROW_DAYS }, (_, i) => (
                <span key={i} className="absolute left-1/2 h-px w-2.5 -translate-x-1/2 bg-ink-muted/60" style={{ top: `${(i / (GROW_DAYS - 1)) * 100}%` }} />
              ))}
              <span ref={markerRef} className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-4 ring-brand/20" />
            </div>
          </>
        )}

        <div
          className={cn(
            "relative z-10 mx-auto grid h-full max-w-6xl px-4 sm:px-6",
            reduced ? "content-center gap-6 py-24" : "items-end pb-6 sm:items-center sm:pb-0"
          )}
        >
          {STAGES.map((_, index) => (
            <StageCard key={STAGES[index].id} index={index} active={index === activeStage} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}
