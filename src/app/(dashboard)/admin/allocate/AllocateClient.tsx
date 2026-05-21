"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Target, ChevronRight, Loader2, Check, Users, ArrowRight } from "lucide-react";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { toast } from "sonner";

type Grower = {
  id: string;
  name: string;
  city: string;
  kitSize: number;
  compositeScore: number;
  taskCount: number;
};

type Plan = {
  id: string;
  totalTrays: number;
  bufferTrays: number;
  sowDate: Date;
  harvestDate: Date;
  status: string;
  order: {
    id: string;
    cropType: string;
    quantityKg: number;
    restaurant: { businessName: string };
  };
};

type Allocation = {
  growerId: string;
  growerName: string;
  compositeScore: number;
  trayCount: number;
};

function allocateTraysLocally(growers: Grower[], totalTrays: number): Allocation[] {
  const eligible = growers.filter((g) => g.compositeScore > 0);
  if (eligible.length === 0) {
    // Distribute evenly if all scores are 0
    const perGrower = Math.ceil(totalTrays / Math.max(growers.length, 1));
    return growers.map((g, i) => ({
      growerId: g.id,
      growerName: g.name,
      compositeScore: g.compositeScore,
      trayCount: i === growers.length - 1 ? totalTrays - perGrower * (growers.length - 1) : perGrower,
    }));
  }

  const totalScore = eligible.reduce((sum, g) => sum + g.compositeScore, 0);
  let assigned = 0;
  return eligible.map((g, i) => {
    const trays =
      i === eligible.length - 1
        ? totalTrays - assigned
        : Math.max(1, Math.round((g.compositeScore / totalScore) * totalTrays));
    assigned += trays;
    return {
      growerId: g.id,
      growerName: g.name,
      compositeScore: g.compositeScore,
      trayCount: trays,
    };
  });
}

export function AllocateClient({
  plans,
  growers,
}: {
  plans: Plan[];
  growers: Grower[];
}) {
  const [planList, setPlanList] = useState(plans);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState<string[]>([]);

  function handleSelectPlan(plan: Plan) {
    setSelectedPlan(plan);
    setAllocations(allocateTraysLocally(growers, plan.totalTrays));
  }

  function handleAutoAllocate() {
    if (!selectedPlan) return;
    setAllocations(allocateTraysLocally(growers, selectedPlan.totalTrays));
  }

  function handleTrayChange(growerId: string, value: number) {
    setAllocations((prev) =>
      prev.map((a) => (a.growerId === growerId ? { ...a, trayCount: Math.max(0, value) } : a))
    );
  }

  const totalAssigned = allocations.reduce((s, a) => s + a.trayCount, 0);

  async function handleDispatch() {
    if (!selectedPlan) return;
    setDispatching(true);
    try {
      const res = await fetch("/api/admin/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          allocations: allocations.filter((a) => a.trayCount > 0),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error || "Dispatch failed");
        return;
      }
      toast.success(
        `✅ Tasks dispatched! ${allocations.filter((a) => a.trayCount > 0).length} growers notified.`
      );
      setDispatched((prev) => [...prev, selectedPlan.id]);
      setPlanList((prev) => prev.filter((p) => p.id !== selectedPlan.id));
      setSelectedPlan(null);
      setAllocations([]);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDispatching(false);
    }
  }

  if (planList.length === 0 && !selectedPlan) {
    return (
      <GlassCard>
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No plans awaiting allocation
          </h3>
          <p className="text-sm text-text-muted">
            Create a production plan in the{" "}
            <a href="/admin/demand" className="text-sprout-700 font-semibold hover:underline">
              Demand Engine
            </a>{" "}
            first.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Plan selection */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text-primary mb-3">
          Production Plans Awaiting Allocation
        </h2>
        {planList.length === 0 ? (
          <div className="rounded-xl border border-sprout-200/40 bg-white/50 p-4 text-sm text-text-muted text-center py-8">
            All plans have been allocated 🎉
          </div>
        ) : (
          planList.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isDone = dispatched.includes(plan.id);
            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "bg-sprout-800/5 border-sprout-700/30 shadow-sm"
                    : isDone
                    ? "bg-sprout-50 border-sprout-200/40 opacity-60"
                    : "bg-white/50 border-white/40 hover:bg-white/70 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {plan.order.restaurant.businessName}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {CROP_DISPLAY_NAMES[plan.order.cropType as CropType] || plan.order.cropType} ·{" "}
                      {plan.order.quantityKg}kg · {plan.totalTrays} total trays
                    </p>
                  </div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-sprout-700 bg-sprout-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isSelected ? "text-sprout-800" : "text-text-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-text-muted">
                  <span>
                    Sow:{" "}
                    {new Date(plan.sowDate).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>→</span>
                  <span>
                    Harvest:{" "}
                    {new Date(plan.harvestDate).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Right: Allocation table */}
      <div>
        {selectedPlan ? (
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Assign Trays</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {totalAssigned} / {selectedPlan.totalTrays} trays assigned
                </p>
              </div>
              <button
                onClick={handleAutoAllocate}
                className="text-xs font-semibold text-sprout-700 bg-sprout-100 hover:bg-sprout-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Auto-Allocate
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="w-full bg-sprout-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-sprout-600 to-sprout-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalAssigned / selectedPlan.totalTrays) * 100, 100)}%`,
                  }}
                />
              </div>
              {totalAssigned !== selectedPlan.totalTrays && (
                <p className="text-[11px] text-amber-600 mt-1">
                  {totalAssigned < selectedPlan.totalTrays
                    ? `⚠ ${selectedPlan.totalTrays - totalAssigned} trays unassigned`
                    : `⚠ ${totalAssigned - selectedPlan.totalTrays} trays over-allocated`}
                </p>
              )}
            </div>

            {growers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No active growers available</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.growerId}
                    className="flex items-center gap-3 bg-white/60 rounded-xl px-3 py-2.5 border border-white/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {allocation.growerName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-16 bg-sprout-100 rounded-full h-1">
                          <div
                            className="bg-sprout-500 h-1 rounded-full"
                            style={{ width: `${allocation.compositeScore * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {Math.round(allocation.compositeScore * 100)}% score
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={selectedPlan.totalTrays}
                        value={allocation.trayCount}
                        onChange={(e) =>
                          handleTrayChange(allocation.growerId, Number(e.target.value))
                        }
                        className="w-16 h-8 rounded-lg border border-sprout-800/20 bg-white/70 px-2 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-sprout-500/30"
                      />
                      <span className="text-xs text-text-muted">trays</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              disabled={
                dispatching ||
                totalAssigned === 0 ||
                allocations.filter((a) => a.trayCount > 0).length === 0
              }
              onClick={handleDispatch}
              className="w-full bg-sprout-800 text-white hover:bg-sprout-900 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {dispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching…
                </>
              ) : (
                <>
                  Dispatch Tasks <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </GlassCard>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] rounded-2xl border-2 border-dashed border-sprout-200/60 bg-white/30">
            <div className="text-center">
              <Target className="w-10 h-10 text-sprout-300 mx-auto mb-2" />
              <p className="text-sm text-text-muted">Select a plan to allocate trays</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
