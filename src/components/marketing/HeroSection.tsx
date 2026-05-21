import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="blob h-[360px] w-[360px] bg-sprout-200 -left-20 top-0" />
      <div className="blob h-[280px] w-[280px] bg-sprout-300/70 bottom-0 right-6" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-text-primary sm:text-6xl">
            Farm-to-fork, <span className="gradient-text">door to door.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-text-secondary sm:text-lg">
            SproutBox turns restaurant demand into distributed microgreen production,
            with grower tasks, QC, hub aggregation, and delivery in one operating system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-sprout-800 text-white hover:bg-sprout-900">
              <Link href="/join/grower">Join as Grower <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-sprout-800 text-sprout-800">
              <Link href="/join/restaurant">Partner as Restaurant</Link>
            </Button>
          </div>
        </div>
        <GlassCard className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sprout-800 text-white">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-muted">Today’s production</p>
              <p className="text-2xl font-black text-text-primary">248 trays active</p>
            </div>
          </div>
          <div className="space-y-3">
            {["Demand calculated", "Growers allocated", "QC queue clean"].map((item, index) => (
              <div key={item} className="flex flex-col gap-2 rounded-xl bg-white/60 p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <span className="text-sm font-semibold text-text-primary">{item}</span>
                <span className="rounded-full bg-sprout-100 px-3 py-1 text-xs font-bold text-sprout-800">
                  {index === 2 ? "Live" : "Done"}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
