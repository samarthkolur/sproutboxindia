"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  Target,
  ChevronRight,
  Loader2,
  Check,
  Users,
  ArrowRight,
  MapPin,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Grower = {
  id: string;
  name: string;
  city: string;
  kitSize: number;
  compositeScore: number;
  activeTasks: number;
  lat: number | null;
  lng: number | null;
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
    restaurant: {
      businessName: string;
      city: string;
      lat: number | null;
      lng: number | null;
    };
  };
};

type ScoredGrowerAllocation = {
  growerId: string;
  growerName: string;
  city: string;
  compositeScore: number;
  distanceKm: number | null;
  proximityScore: number; // 0–1
  combinedScore: number;  // weighted final score
  trayCount: number;
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Proximity + quality combined allocation ──────────────────────────────────
// Weights: 50% proximity, 50% composite quality score
// Growers without GPS fall to the bottom but are still included

function scoreAndAllocate(
  growers: Grower[],
  totalTrays: number,
  restaurantLat: number | null,
  restaurantLng: number | null
): ScoredGrowerAllocation[] {
  if (growers.length === 0 || totalTrays <= 0) return [];

  const MAX_DISTANCE_KM = 30; // beyond this, proximity score → 0

  const scored = growers.map((g) => {
    let distanceKm: number | null = null;
    let proximityScore = 0;

    if (
      g.lat != null &&
      g.lng != null &&
      restaurantLat != null &&
      restaurantLng != null
    ) {
      distanceKm = haversineKm(g.lat, g.lng, restaurantLat, restaurantLng);
      // Linear decay: 0 km → 1.0 score, 30 km+ → 0.0 score
      proximityScore = Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM);
    } else {
      // No GPS data: treat as mid-distance
      proximityScore = 0.3;
    }

    // Combined = 50% proximity + 50% composite quality
    const combinedScore = proximityScore * 0.5 + g.compositeScore * 0.5;

    return {
      growerId: g.id,
      growerName: g.name,
      city: g.city,
      compositeScore: g.compositeScore,
      distanceKm,
      proximityScore,
      combinedScore,
      trayCount: 0, // filled below
    };
  });

  // Sort by combined score descending
  scored.sort((a, b) => b.combinedScore - a.combinedScore);

  // Weighted proportional tray assignment
  const totalScore = scored.reduce((s, g) => s + g.combinedScore, 0) || scored.length;
  let assigned = 0;

  return scored.map((g, i) => {
    const trays =
      i === scored.length - 1
        ? totalTrays - assigned
        : Math.max(1, Math.round((g.combinedScore / totalScore) * totalTrays));
    assigned += trays;
    return { ...g, trayCount: trays };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllocateClient({
  plans,
  growers,
}: {
  plans: Plan[];
  growers: Grower[];
}) {
  const [planList, setPlanList] = useState(plans);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [allocations, setAllocations] = useState<ScoredGrowerAllocation[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState<string[]>([]);

  function handleSelectPlan(plan: Plan) {
    setSelectedPlan(plan);
    setAllocations(
      scoreAndAllocate(
        growers,
        plan.totalTrays,
        plan.order.restaurant.lat,
        plan.order.restaurant.lng
      )
    );
  }

  function handleAutoAllocate() {
    if (!selectedPlan) return;
    setAllocations(
      scoreAndAllocate(
        growers,
        selectedPlan.totalTrays,
        selectedPlan.order.restaurant.lat,
        selectedPlan.order.restaurant.lng
      )
    );
  }

  function handleTrayChange(growerId: string, value: number) {
    setAllocations((prev) =>
      prev.map((a) =>
        a.growerId === growerId ? { ...a, trayCount: Math.max(0, value) } : a
      )
    );
  }

  const totalAssigned = allocations.reduce((s, a) => s + a.trayCount, 0);

  async function handleDispatch() {
    if (!selectedPlan) return;
    const validAllocations = allocations.filter((a) => a.trayCount > 0);
    if (validAllocations.length === 0) {
      toast.error("No trays assigned — adjust counts before dispatching");
      return;
    }

    setDispatching(true);
    try {
      const res = await fetch("/api/admin/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          allocations: validAllocations.map((a) => ({
            growerId: a.growerId,
            trayCount: a.trayCount,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || `Dispatch failed (${res.status})`);
        return;
      }

      toast.success(
        `✅ Tasks sent! ${validAllocations.length} grower${
          validAllocations.length > 1 ? "s" : ""
        } notified — direct delivery to ${selectedPlan.order.restaurant.businessName}`
      );
      setDispatched((prev) => [...prev, selectedPlan.id]);
      setPlanList((prev) => prev.filter((p) => p.id !== selectedPlan.id));
      setSelectedPlan(null);
      setAllocations([]);
    } catch (err) {
      console.error("Dispatch error:", err);
      toast.error("Network error — check your connection and try again");
    } finally {
      setDispatching(false);
    }
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
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
            <a
              href="/admin/demand"
              className="text-sprout-700 font-semibold hover:underline"
            >
              Demand Engine
            </a>{" "}
            first.
          </p>
        </div>
      </GlassCard>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── LEFT: Plan selection ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
          Plans Awaiting Allocation
        </h2>

        {planList.length === 0 ? (
          <div className="rounded-xl border border-sprout-200/40 bg-white/50 p-6 text-sm text-text-muted text-center">
            All plans have been allocated 🎉
          </div>
        ) : (
          planList.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isDone = dispatched.includes(plan.id);
            const hasRestaurantGPS =
              plan.order.restaurant.lat != null &&
              plan.order.restaurant.lng != null;
            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "bg-sprout-800/5 border-sprout-700/30 shadow-sm ring-1 ring-sprout-700/20"
                    : isDone
                    ? "bg-sprout-50 border-sprout-200/40 opacity-60"
                    : "bg-white/50 border-white/40 hover:bg-white/80 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text-primary truncate">
                        {plan.order.restaurant.businessName}
                      </p>
                      {!hasRestaurantGPS && (
                        <span
                          className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/50 flex-shrink-0"
                          title="Restaurant location not set — proximity scoring unavailable"
                        >
                          No GPS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      {CROP_DISPLAY_NAMES[plan.order.cropType as CropType] ||
                        plan.order.cropType}{" "}
                      · {plan.order.quantityKg}kg · {plan.totalTrays} trays
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {plan.order.restaurant.city} · Direct delivery
                    </p>
                  </div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-sprout-700 bg-sprout-100 px-2 py-0.5 rounded-full flex-shrink-0">
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
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
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

      {/* ── RIGHT: Allocation table ─────────────────────────────────────────── */}
      <div>
        {selectedPlan ? (
          <GlassCard>
            {/* Header */}
            <div className="mb-1 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-text-primary">
                  Assign Trays
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Growers sorted by proximity to{" "}
                  <span className="font-semibold text-sprout-700">
                    {selectedPlan.order.restaurant.businessName}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAllocations(allocations.map(a => ({ ...a, trayCount: 0 })))}
                  className="flex-shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  Clear All
                </button>
                <button
                  onClick={handleAutoAllocate}
                  className="flex-shrink-0 rounded-lg bg-sprout-100 px-3 py-1.5 text-xs font-semibold text-sprout-700 transition-colors hover:bg-sprout-200"
                >
                  Auto-Allocate
                </button>
              </div>
            </div>

            {/* Direct delivery notice */}
            <div className="mb-4 mt-3 flex items-start gap-2 rounded-xl border border-blue-200/40 bg-blue-50/60 px-3 py-2">
              <Navigation className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-[11px] text-blue-700">
                Direct delivery — growers ship straight to restaurant. Nearest growers ranked first.
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex flex-col gap-1 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <span className="text-text-muted">
                  {totalAssigned} / {selectedPlan.totalTrays} trays
                </span>
                {totalAssigned !== selectedPlan.totalTrays && (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {totalAssigned < selectedPlan.totalTrays
                      ? `${selectedPlan.totalTrays - totalAssigned} unassigned`
                      : `${totalAssigned - selectedPlan.totalTrays} over`}
                  </span>
                )}
              </div>
              <div className="w-full bg-sprout-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-sprout-600 to-sprout-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (totalAssigned / selectedPlan.totalTrays) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Grower rows */}
            {growers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No active growers</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {allocations.map((a, rank) => (
                  <div
                    key={a.growerId}
                    className={`flex flex-col gap-3 rounded-xl border px-3 py-2.5 transition-all min-[520px]:flex-row min-[520px]:items-center ${
                      rank === 0
                        ? "bg-sprout-50/70 border-sprout-300/40"
                        : "bg-white/60 border-white/40"
                    }`}
                  >
                    {/* Rank badge */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        rank === 0
                          ? "bg-sprout-800 text-white"
                          : rank === 1
                          ? "bg-sprout-200 text-sprout-900"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rank + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {a.growerName}
                        </p>
                        {rank === 0 && (
                          <span className="text-[9px] font-bold text-sprout-700 bg-sprout-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            NEAREST
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {/* Distance */}
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <MapPin className="w-2.5 h-2.5" />
                          {a.distanceKm != null
                            ? `${a.distanceKm.toFixed(1)} km`
                            : a.city}
                        </span>
                        {/* Score bar */}
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-sprout-100 rounded-full h-1">
                            <div
                              className="bg-sprout-500 h-1 rounded-full"
                              style={{
                                width: `${a.combinedScore * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {Math.round(a.combinedScore * 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tray input */}
                    <div className="flex flex-shrink-0 items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        max={selectedPlan.totalTrays}
                        value={a.trayCount}
                        onChange={(e) =>
                          handleTrayChange(a.growerId, Number(e.target.value))
                        }
                        className="w-14 h-8 rounded-lg border border-sprout-800/20 bg-white/80 px-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-sprout-500/30"
                      />
                      <span className="text-[10px] text-text-muted">trays</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dispatch button */}
            <button
              disabled={
                dispatching ||
                totalAssigned === 0 ||
                allocations.filter((a) => a.trayCount > 0).length === 0
              }
              onClick={handleDispatch}
              className="w-full bg-sprout-800 text-white hover:bg-sprout-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-sprout-800/20 active:scale-[0.99]"
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
            </button>
          </GlassCard>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[240px] rounded-2xl border-2 border-dashed border-sprout-200/60 bg-white/30">
            <div className="text-center px-6">
              <Target className="w-10 h-10 text-sprout-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-primary mb-1">
                Select a production plan
              </p>
              <p className="text-xs text-text-muted">
                Growers will be ranked by distance to the restaurant
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
