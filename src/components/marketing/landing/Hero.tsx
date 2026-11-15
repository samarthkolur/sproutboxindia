import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatusChip } from "@/components/ui/status-chip";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

// A sample of the restaurant's order tracking, built from the real components.
// It is labelled illustrative: no invented traction numbers.
const SAMPLE_STEPS: TimelineItem[] = [
  { key: "confirmed", title: "Confirmed", state: "done" },
  { key: "production", title: "In production", state: "current" },
  { key: "hub", title: "At hub", state: "upcoming" },
  { key: "transit", title: "In transit", state: "upcoming" },
  { key: "delivered", title: "Delivered", state: "upcoming" },
];

export function Hero() {
  return (
    <section className="px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-leaf-soft px-3.5 py-1.5 text-sm font-medium text-ink">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-leaf" />
            Now onboarding growers &amp; restaurants
          </span>
          <h1 className="mt-6 text-4xl font-light leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Farm-to-fork, door to door.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            A demand-driven, decentralized microgreen network — connecting restaurants with home-based growers for the
            freshest produce, delivered on schedule.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/join/grower">
                Join as Grower
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-hairline bg-panel/60">
              <Link href="/join/restaurant">Partner as Restaurant</Link>
            </Button>
          </div>
        </div>

        <figure>
          <Panel padding="lg" aria-label="Sample order tracking">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-ink-muted">Sunflower Shoots</p>
                <p className="mt-1 text-3xl font-light tracking-tight text-ink">4 kg</p>
              </div>
              <StatusChip status="IN_PRODUCTION" />
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-inset/70 p-4">
              <Ring percent={(4 / 9) * 100} size={72} strokeWidth={6} label="Day 4 of 9">
                <span className="text-lg font-light text-ink">4/9</span>
              </Ring>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Day 4 of 9</p>
                <p className="mt-0.5 text-micro text-ink-muted">Growing at a home grower near you</p>
              </div>
            </div>

            <Timeline items={SAMPLE_STEPS} className="mt-5" />
          </Panel>
          <figcaption className="mt-3 text-center text-micro text-ink-muted">Sample dashboard — illustrative preview</figcaption>
        </figure>
      </div>
    </section>
  );
}
