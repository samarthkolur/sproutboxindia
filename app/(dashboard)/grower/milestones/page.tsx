import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import MilestoneTracker from "@/components/dashboard/MilestoneTracker"

export default async function GrowerMilestonesPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "grower") redirect("/login")

  const supabase = await createClient()

  const { data: activeTray } = await supabase
    .from("tray_assignments")
    .select("*")
    .eq("grower_id", profile.id)
    .in("status", ["assigned", "growing", "qc_pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  let milestones: any[] = []
  if (activeTray) {
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("tray_id", activeTray.id)
      .order("day_number")
    milestones = data || []
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Growth Milestones</h1>
        <p className="text-sm text-muted-foreground mt-1">Biological tracking for the active crop</p>
      </div>

      {!activeTray ? (
        <p className="text-muted-foreground text-sm">No active tray found to track milestones.</p>
      ) : (
        <MilestoneTracker 
          milestones={milestones}
          currentDay={activeTray.current_day}
        />
      )}
    </div>
  )
}
