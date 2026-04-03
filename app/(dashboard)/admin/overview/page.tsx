import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export default async function AdminOverviewPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")
  const supabase = await createClient()

  const { data: orders } = await supabase.from("orders").select("*")
  const { data: trays } = await supabase.from("tray_assignments").select("*")
  const { data: qcPending } = await supabase.from("tray_assignments").select("id").eq("status", "qc_pending")

  const totalTraysDemanded = orders?.reduce((sum, o) => sum + o.total_trays, 0) || 0
  const totalTraysAssigned = trays?.length || 0
  const unassignedDemand = Math.max(0, totalTraysDemanded - totalTraysAssigned)
  const readyTrays = trays?.filter((t) => t.status === "approved" || t.status === "completed").length || 0
  const pendingOrders = orders?.filter((o) => o.status === "pending" || o.status === "assigned_to_growers").length || 0

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-blue-500">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">High-level system metrics and alerts</p>
      </div>

      {/* ISSUE DETECTION BANNER */}
      {(unassignedDemand > 0 || (qcPending?.length ?? 0) > 0) && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-500 font-bold">
            <AlertTriangle className="h-5 w-5" />
            <span>Immediate Attention Required</span>
          </div>
          <div className="flex gap-4 mt-2">
            {unassignedDemand > 0 && (
              <span className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400">
                {unassignedDemand} Trays Unassigned
              </span>
            )}
            {(qcPending?.length ?? 0) > 0 && (
              <span className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-semibold text-yellow-500 border border-yellow-500/20">
                {qcPending!.length} Batches Pending QC
              </span>
            )}
          </div>
        </div>
      )}

      {/* DEMAND STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Demand</p>
          <p className="text-2xl font-bold">{totalTraysDemanded} <span className="text-base font-normal text-muted-foreground">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Assigned</p>
          <p className="text-2xl font-bold">{totalTraysAssigned} <span className="text-base font-normal text-muted-foreground">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1 text-sprout-400">Yield Ready</p>
          <p className="text-2xl font-bold text-sprout-400">{readyTrays} <span className="text-base font-normal opacity-70">trays</span></p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1 text-blue-400">Open Orders</p>
          <p className="text-2xl font-bold text-blue-400">{pendingOrders} <span className="text-base font-normal opacity-70">active</span></p>
        </div>
      </div>
    </div>
  )
}
