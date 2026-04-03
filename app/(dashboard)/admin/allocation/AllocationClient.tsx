"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Layers, CheckCircle2, AlertTriangle, Users, PlayCircle, Loader2 } from "lucide-react"

export default function AllocationClient({ orders, trays, growers }: { orders: any[], trays: any[], growers: any[] }) {
  const [isAllocating, setIsAllocating] = useState(false)
  const [allocationSuccess, setAllocationSuccess] = useState(false)

  // MACRO computations
  const pendingOrders = orders.filter(o => o.status === "pending")
  const requiredTrays = orders.reduce((sum, o) => sum + o.total_trays, 0)
  const assignedTrays = trays.length
  const unassignedTrays = Math.max(0, requiredTrays - assignedTrays)

  const pieData = [
    { name: "Assigned", value: assignedTrays, color: "#34d399" },
    { name: "Unassigned Gap", value: unassignedTrays, color: "#ef4444" },
  ].filter(d => d.value > 0)

  const growerMap = useMemo(() => {
    const map: Record<string, { name: string, assigned: number, crops: Set<string> }> = {}
    trays.forEach(t => {
      if (!map[t.grower_name]) map[t.grower_name] = { name: t.grower_name, assigned: 0, crops: new Set() }
      map[t.grower_name].assigned += 1
      map[t.grower_name].crops.add(t.crop_name)
    })
    return Object.values(map).sort((a,b) => b.assigned - a.assigned)
  }, [trays])

  // THE FULL ALLOCATION ENGINE -> order -> split to growers -> assign -> update status
  async function runAllocation() {
    if (pendingOrders.length === 0 || growers.length === 0) return
    setIsAllocating(true)
    setAllocationSuccess(false)

    try {
      const supabase = createClient()
      const newAssignments = []
      const newAllocations = []
      
      let currentGrowerIndex = 0

      for (const order of pendingOrders) {
        // Distribute order total trays across round-robin growers
        const numTrays = order.total_trays
        const items = order.items as any[] 
        const primaryCrop = items.length > 0 ? items[0].crop_name : "Mixed Greens"
        
        for (let i = 0; i < numTrays; i++) {
          const grower = growers[currentGrowerIndex]
          
          // Generate unique tray logic code
          const trayCode = `SB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          
          // Harvest happens 7 days from allocation assuming default rules
          const harvestDate = new Date()
          harvestDate.setDate(harvestDate.getDate() + 7)

          // 1. Prepare TrayAssignment insertion payload
          const trayPayload = {
            id: crypto.randomUUID(), // we need UUID back, but supabase generates it. So we pre-gen to link.
            grower_id: grower.id,
            tray_code: trayCode,
            crop_name: primaryCrop,
            start_date: new Date().toISOString(),
            expected_harvest_date: harvestDate.toISOString(),
            status: "assigned",
            current_day: 1,
            total_days: 7,
            seed_type: primaryCrop,
            seed_batch_id: `BAT-${Math.floor(Math.random() * 9999)}`,
            seed_quantity_grams: 50 // baseline mock tracking for seeds
          }
          
          newAssignments.push(trayPayload)

          // 2. Prepare Allocation insertion payload
          const allocationPayload = {
            order_id: order.id,
            tray_id: trayPayload.id,
            grower_id: grower.id
          }
          
          newAllocations.push(allocationPayload)

          // Round-robin distribution increment
          currentGrowerIndex = (currentGrowerIndex + 1) % growers.length
        }

        // 3. Update Order Status
        await supabase
          .from("orders")
          .update({ status: "assigned_to_growers" })
          .eq("id", order.id)
      }

      // Execute Bulk DB Insertions
      if (newAssignments.length > 0) {
        const { error: trayError } = await supabase.from("tray_assignments").insert(newAssignments)
        if (trayError) throw trayError
        
        const { error: allocError } = await supabase.from("allocations").insert(newAllocations)
        if (allocError) throw allocError
      }

      setAllocationSuccess(true)
      
      // Auto reload after success to re-fetch
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (err: any) {
      console.error(err)
      alert("Allocation Sequence Failed: " + err.message)
    } finally {
      setIsAllocating(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* MACRO STATS + ALLOCATION EXECUTOR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Trays Required", value: requiredTrays, icon: Layers, color: "text-blue-400" },
          { label: "Trays Assigned", value: assignedTrays, icon: CheckCircle2, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
          </div>
        ))}
        
        <div className={`rounded-2xl border p-5 backdrop-blur-xl flex items-center justify-between ${unassignedTrays > 0 ? 'border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/10' : 'border-white/[0.06] bg-white/[0.03]'}`}>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Unassigned</p>
            <p className={`text-2xl font-bold mt-1 ${unassignedTrays > 0 ? "text-red-400" : "text-white/30"}`}>{unassignedTrays}</p>
          </div>
          <AlertTriangle className={`h-8 w-8 opacity-20 ${unassignedTrays > 0 ? "text-red-400" : "text-white/30"}`} />
        </div>

        {/* EXECUTOR BUTTON */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl flex flex-col justify-center items-center relative overflow-hidden">
          {unassignedTrays === 0 ? (
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> System Optimized</p>
          ) : (
            <>
              <p className="text-xs text-center text-muted-foreground mb-3">{unassignedTrays} trays pending dispatch</p>
              <button 
                onClick={runAllocation}
                disabled={isAllocating || allocationSuccess}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${allocationSuccess ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-sprout-500 hover:bg-sprout-400 text-black"}`}
              >
                {isAllocating ? <><Loader2 className="h-4 w-4 animate-spin" /> Distributing...</> : 
                 allocationSuccess ? <><CheckCircle2 className="h-4 w-4" /> Allocated</> :
                 <><PlayCircle className="h-4 w-4" /> Run Allocation</>}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH - ALLOCATION */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl flex flex-col items-center justify-center relative min-h-[300px]">
          <h3 className="text-base font-semibold absolute top-5 left-5">Allocation Ratio</h3>
          
          <div className="w-full h-full mt-10">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: "No Data", value: 1, color: "#222" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(pieData.length > 0 ? pieData : [{ name: "No Data", value: 1, color: "#222" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {pieData.length > 0 && (
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                )}
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GROWER BREAKDOWN */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">Active Production Sources</h3>
          </div>
          
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/[0.04] text-xs uppercase text-muted-foreground border-y border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Grower</th>
                  <th className="px-4 py-3 font-semibold">Crops Cultivating</th>
                  <th className="px-4 py-3 font-semibold text-right">Trays Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {growerMap.map((grower, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{grower.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {Array.from(grower.crops).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-white/10 px-2.5 py-1 rounded-full font-bold text-sprout-400">
                        {grower.assigned}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {growerMap.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 border border-dashed border-white/10 rounded-xl mt-4">
                      <p className="text-sm font-semibold mb-1">No active network nodes.</p>
                      <p className="text-xs text-muted-foreground opacity-70">Execute an Allocation Run to automatically distribute pending demand to idle constraints.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
