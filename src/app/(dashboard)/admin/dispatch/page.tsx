import { GlassCard } from "@/components/shared/GlassCard";
import { getPendingDispatches } from "@/actions/dispatch.actions";
import { DispatchClient } from "./DispatchClient";
import { Truck } from "lucide-react";

export default async function DispatchPage() {
  const dispatches = await getPendingDispatches();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Truck className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Dispatch Supplies
          </h1>
        </div>
        <p className="text-text-secondary">
          Manage and track seed and tray deliveries to growers
        </p>
      </div>

      <GlassCard>
        {dispatches.length > 0 ? (
          <div className="space-y-4">
            {dispatches.map((dispatch) => (
              <DispatchClient key={dispatch.id} dispatch={dispatch} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              No pending dispatches
            </h3>
            <p className="text-sm text-text-muted">
              All allocated tasks have received their supplies.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
