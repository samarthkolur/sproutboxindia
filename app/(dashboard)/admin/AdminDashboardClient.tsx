"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Profile, TrayAssignment } from "@/lib/types"

// We define minimal interfaces here for the raw data coming from Supabase
interface Order {
  id: string
  restaurant_id: string
  items: any
  total_trays: number
  status: string
  delivery_date: string
}

interface AdminTray extends TrayAssignment {
  grower_name: string
}

interface AdminDashboardClientProps {
  profile: Profile
  orders: Order[]
  trays: AdminTray[]
  growers: Profile[]
  qcPending: AdminTray[]
}

export default function AdminDashboardClient({
  profile,
  orders,
  trays,
  growers,
  qcPending,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "allocations" | "batches" | "qc">("overview")

  // --- DERIVED DATA ---
  
  // Demand Overview (Orders)
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "assigned_to_growers").length
  const totalTraysDemanded = orders.reduce((sum, o) => sum + o.total_trays, 0)
  
  // Allocation Monitor
  const totalTraysAssigned = trays.length
  const unassignedDemand = Math.max(0, totalTraysDemanded - totalTraysAssigned)

  // Batch Tracking
  const growingTrays = trays.filter((t) => t.status === "growing").length
  const readyTrays = trays.filter((t) => t.status === "approved" || t.status === "completed").length

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-blue-500">Command Center</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System Overview & Production Operations
        </p>
      </motion.div>

      {/* ISSUE DETECTION BANNER */}
      {(unassignedDemand > 0 || qcPending.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 backdrop-blur-xl flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-red-500 font-bold">
            <span className="text-lg">⚠</span>
            <span>Immediate Attention Required</span>
          </div>
          <div className="flex gap-4 mt-2">
            {unassignedDemand > 0 && (
              <span className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400">
                {unassignedDemand} Trays Unassigned
              </span>
            )}
            {qcPending.length > 0 && (
              <span className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-semibold text-yellow-500 border border-yellow-500/20">
                {qcPending.length} Batches Pending QC
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* DEMAND & ALLOCATION (TOP CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Demand</p>
          <p className="text-2xl font-bold">{totalTraysDemanded} <span className="text-base font-normal text-muted-foreground">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Assigned</p>
          <p className="text-2xl font-bold">{totalTraysAssigned} <span className="text-base font-normal text-muted-foreground">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1 text-sprout-400">Yield Ready</p>
          <p className="text-2xl font-bold text-sprout-400">{readyTrays} <span className="text-base font-normal opacity-70">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1 text-blue-400">Open Orders</p>
          <p className="text-2xl font-bold text-blue-400">{pendingOrders} <span className="text-base font-normal opacity-70">active</span></p>
        </div>
      </div>

      {/* TABS FOR DEEP DIVES */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-px mt-6">
        {[
          { id: "overview", label: "Grower Overview" },
          { id: "batches", label: "Batch Tracking" },
          { id: "qc", label: "QC Operations" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. GROWER OVERVIEW */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/[0.04] text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Grower</th>
                  <th className="px-6 py-4 font-semibold">Trays Assigned</th>
                  <th className="px-6 py-4 font-semibold">Active Growing</th>
                  <th className="px-6 py-4 font-semibold text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {growers.map((grower) => {
                  const growerTrays = trays.filter(t => t.grower_id === grower.id)
                  const growing = growerTrays.filter(t => t.status === "growing").length
                  const completed = growerTrays.filter(t => t.status === "completed" || t.status === "approved").length
                  const rate = growerTrays.length ? Math.round((completed / growerTrays.length) * 100) : 0

                  return (
                    <tr key={grower.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium">{grower.full_name || grower.email}</td>
                      <td className="px-6 py-4">{growerTrays.length}</td>
                      <td className="px-6 py-4">{growing}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${rate > 80 ? 'bg-sprout-500/20 text-sprout-400' : 'bg-white/10'}`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 2. BATCH TRACKING */}
      {activeTab === "batches" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/[0.04] text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Batch Code</th>
                  <th className="px-6 py-4 font-semibold">Crop</th>
                  <th className="px-6 py-4 font-semibold">Grower</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {trays.map((tray) => (
                  <tr key={tray.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{tray.tray_code}</td>
                    <td className="px-6 py-4 font-medium">{tray.crop_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{tray.grower_name}</td>
                    <td className="px-6 py-4">
                      <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-white/10">
                        {tray.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      Day {tray.current_day} / {tray.total_days}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 3. QC OPERATIONS */}
      {activeTab === "qc" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {qcPending.length === 0 ? (
            <div className="text-center p-12 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
              <span className="text-4xl opacity-50">✅</span>
              <p className="mt-4 font-medium">All clear!</p>
              <p className="text-sm text-muted-foreground mt-1">No batches are currently pending Quality Control.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qcPending.map(batch => (
                <div key={batch.id} className="border border-yellow-500/30 bg-yellow-500/[0.02] rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold">{batch.crop_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{batch.grower_name}</p>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold px-2 py-1 rounded">QC Pending</span>
                  </div>
                  
                  <div className="space-y-1 text-sm font-mono text-xs bg-black/20 p-3 rounded-lg mb-4">
                    <p>Batch: {batch.tray_code}</p>
                    <p>Seed Type: {batch.seed_type}</p>
                    <p>Seed Batch: {batch.seed_batch_id}</p>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold py-2 rounded-lg transition-colors text-sm border border-green-500/20">
                      Approve
                    </button>
                    <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold py-2 rounded-lg transition-colors text-sm border border-red-500/20">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
