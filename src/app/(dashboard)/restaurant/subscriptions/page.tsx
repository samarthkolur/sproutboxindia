import { GlassCard } from "@/components/shared/GlassCard";
import { RotateCw } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Subscriptions</h1>
        <p className="text-text-secondary mt-1">Manage recurring microgreen deliveries</p>
      </div>

      <GlassCard>
        <div className="text-center py-16">
          <RotateCw className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No subscriptions</h3>
          <p className="text-sm text-text-muted">
            Set up recurring orders for automatic weekly or bi-weekly deliveries
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
