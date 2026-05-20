"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <GlassCard className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-black text-text-primary">Dashboard unavailable</h1>
      <p className="mt-2 text-sm text-text-muted">Refresh the dashboard data and try again.</p>
      <Button className="mt-5 bg-sprout-800 text-white hover:bg-sprout-900" onClick={reset}>
        Retry
      </Button>
    </GlassCard>
  );
}
