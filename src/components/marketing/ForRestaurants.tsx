import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export function ForRestaurants() {
  return (
    <GlassCard>
      <h3 className="text-xl font-black text-text-primary">For restaurants</h3>
      <p className="mt-2 text-sm text-text-muted">
        Place recurring microgreen orders and track production, delivery, and quality.
      </p>
      <Button asChild className="mt-5 bg-sprout-800 text-white hover:bg-sprout-900">
        <Link href="/join/restaurant">Partner with us</Link>
      </Button>
    </GlassCard>
  );
}
