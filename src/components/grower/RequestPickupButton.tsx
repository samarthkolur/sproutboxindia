"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { toast } from "sonner";

export function RequestPickupButton({ taskId, disabled }: { taskId: string; disabled?: boolean }) {
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
      className="flex items-center gap-1.5 px-3 py-1.5 bg-sprout-600 hover:bg-sprout-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-sprout-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Truck className="w-3.5 h-3.5" />
      )}
      Request Pickup
    </button>
  );
}
