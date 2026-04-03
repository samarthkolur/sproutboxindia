import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminBatchesPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")
  
  const supabase = await createClient()

  // Fetch Trays + Profiles for UI
  const { data: trays } = await supabase
    .from("tray_assignments")
    .select(`
      *,
      profiles:grower_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  const formattedTrays = trays?.map(tray => ({
    ...tray,
    grower_name: tray.profiles?.full_name || tray.profiles?.email || "Unknown Grower"
  })) || []

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-blue-500">Batch Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Lifecycle monitoring for all assigned trays</p>
      </div>

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
            {formattedTrays.map((tray) => (
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
            {formattedTrays.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No batches found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
