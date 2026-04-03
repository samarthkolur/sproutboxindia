import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function GrowerHistoryPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "grower") redirect("/login")

  const supabase = await createClient()

  const { data: history } = await supabase
    .from("tray_assignments")
    .select("*")
    .eq("grower_id", profile.id)
    .in("status", ["completed", "approved"])
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Growing History</h1>
        <p className="text-sm text-muted-foreground mt-1">Records of all approved and completed trays</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.04] text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Tray Code</th>
                <th className="px-6 py-4 font-semibold">Crop</th>
                <th className="px-6 py-4 font-semibold">Final Status</th>
                <th className="px-6 py-4 font-semibold text-right">Harvest Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {(history || []).map((tray) => (
                <tr key={tray.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{tray.tray_code}</td>
                  <td className="px-6 py-4 font-medium">{tray.crop_name}</td>
                  <td className="px-6 py-4">
                    <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-white/10 text-sprout-400">
                      {tray.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {new Date(tray.expected_harvest_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!history?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    You have no completed trays in your history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  )
}
