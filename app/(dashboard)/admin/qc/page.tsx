import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default async function AdminQCPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")
  
  const supabase = await createClient()

  // Fetch QC pending items
  const { data: qcPending } = await supabase
    .from("tray_assignments")
    .select(`
      *,
      profiles:grower_id (
        full_name,
        email
      )
    `)
    .eq("status", "qc_pending")

  const formattedQC = qcPending?.map(tray => ({
    ...tray,
    grower_name: tray.profiles?.full_name || tray.profiles?.email || "Unknown Grower"
  })) || []

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-blue-500">QC Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">Review batches awaiting manual quality control approval</p>
      </div>

        {formattedQC.length === 0 ? (
          <div className="text-center p-12 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="mt-4 font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No batches are currently pending Quality Control.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formattedQC.map(batch => (
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
    </div>
  )
}
