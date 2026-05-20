import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export function ForGrowers() {
  return (
    <GlassCard>
      <h3 className="text-xl font-black text-text-primary">For growers</h3>
      <p className="mt-2 text-sm text-text-muted">
        Receive tray tasks, daily instructions, QC feedback, and payouts from one dashboard.
      </p>
      <Button asChild className="mt-5 bg-sprout-800 text-white hover:bg-sprout-900">
        <Link href="/join/grower">Start growing</Link>
      </Button>
    </GlassCard>
  );
}
