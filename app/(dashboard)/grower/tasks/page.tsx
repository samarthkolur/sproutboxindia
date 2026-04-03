import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import DailyInstructions from "@/components/dashboard/DailyInstructions"

export default async function GrowerTasksPage() {
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

  let instructions: any[] = []
  if (activeTray) {
    const { data } = await supabase
      .from("daily_instructions")
      .select("*")
      .eq("tray_id", activeTray.id)
      .order("day_number")
    instructions = data || []
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Daily operational procedures</p>
      </div>

      {!activeTray ? (
        <p className="text-muted-foreground text-sm">No active tray found to retrieve tasks from.</p>
      ) : (
        <DailyInstructions 
          instructions={instructions}
          currentDay={activeTray.current_day}
          uploadRequired={[3, 6].includes(activeTray.current_day)}
        />
      )}
    </div>
  )
}
