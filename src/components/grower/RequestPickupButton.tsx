"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { trackGrowerEngagement } from "@/lib/gtag";
import { actionButtonClass, type ActionTone } from "./action-button";

export function RequestPickupButton({ taskId, disabled, tone = "solid" }: { taskId: string; disabled?: boolean; tone?: ActionTone }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grower/request-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request pickup");
      }

      trackGrowerEngagement("pickup_requested", { task_id: taskId });
      toast.success("Pickup Requested!", {
        description: "Admin has been notified for dispatch.",
      });
      router.refresh();
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleRequest();
      }}
      disabled={loading || disabled}
      className={actionButtonClass(tone)}
    >
      {loading ? (
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current motion-reduce:animate-none" />
      ) : (
        <Truck className="h-4 w-4" aria-hidden="true" />
      )}
      Request Pickup
    </button>
  );
}
