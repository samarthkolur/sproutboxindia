import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import UploadSection from "@/components/dashboard/UploadSection"

export default async function GrowerUploadsPage() {
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

  let uploads: any[] = []
  if (activeTray) {
    const { data } = await supabase
      .from("growth_uploads")
      .select("*")
      .eq("tray_id", activeTray.id)
      .order("uploaded_at", { ascending: false })
    uploads = data || []
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Quality Control Uploads</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload required photos for Day 3 and Day 6 QC</p>
      </div>

      {!activeTray ? (
        <p className="text-muted-foreground text-sm">No active tray found to upload images for.</p>
      ) : (
        <div className="max-w-2xl">
          <UploadSection 
            trayId={activeTray.id} 
            dayNumber={activeTray.current_day} 
            existingUploads={uploads} 
          />
        </div>
      )}
    </div>
  )
}
