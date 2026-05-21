"use client";

import { useState } from "react";
import { markSeedsDelivered } from "@/actions/dispatch.actions";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { toast } from "sonner";
import { User, Sprout, CheckCircle2 } from "lucide-react";

export function DispatchClient({
  dispatch,
}: {
  dispatch: {
    id: string;
    cropType: string;
    trayCount: number;
    grower: { user?: { name: string | null } | null };
    plan?: { order?: { restaurant?: { businessName: string } | null } | null } | null;
  };
}) {
  const [loading, setLoading] = useState(false);

  const handleMarkDelivered = async () => {
    setLoading(true);
    try {
      await markSeedsDelivered(dispatch.id);
      toast.success("Supplies Marked Delivered", {
        description: `Grower ${dispatch.grower.user?.name || "Unknown"} has been notified.`,
      });
    } catch (err) {
      toast.error("Failed to mark delivered", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const cropName = CROP_DISPLAY_NAMES[dispatch.cropType as CropType] || dispatch.cropType;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 rounded-xl p-4 border border-white/40 row-hover">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
            PENDING DISPATCH
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {cropName} ({dispatch.trayCount} trays)
          </span>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-4">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <User className="w-4 h-4 text-text-muted" />
            <span className="truncate">Grower: {dispatch.grower.user?.name || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Sprout className="w-4 h-4 text-text-muted" />
            <span className="truncate">For: {dispatch.plan?.order?.restaurant?.businessName || "Unknown"}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleMarkDelivered}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sprout-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-sprout-900 active:scale-95 disabled:opacity-50 md:w-auto"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Mark Delivered
      </button>
    </div>
  );
}
