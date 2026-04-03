import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import ClustersClient from "./ClustersClient"

export default async function AdminClustersPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")

  const supabase = await createClient()

  const { data: growers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "grower")

  const { data: trays } = await supabase
    .from("tray_assignments")
    .select("*")

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Network Clusters</h1>
        <p className="text-sm text-muted-foreground mt-1">Organize and visualize production zones across the system.</p>
      </div>

      <ClustersClient growers={growers || []} trays={trays || []} />
    </div>
  )
}
