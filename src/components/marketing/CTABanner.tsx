import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export function CTABanner() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <GlassCard className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-black text-text-primary">Build the next tray cycle today.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-text-muted">
          Run demand, allocate growers, review QC, and move orders through delivery without spreadsheet drift.
        </p>
        <Button asChild className="mt-6 bg-sprout-800 text-white hover:bg-sprout-900">
          <Link href="/register">Open SproutBox</Link>
        </Button>
      </GlassCard>
    </section>
  );
}
