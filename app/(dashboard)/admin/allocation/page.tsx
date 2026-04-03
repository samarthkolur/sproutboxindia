import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import AllocationClient from "./AllocationClient"

export default async function AdminAllocationPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")

  const supabase = await createClient()

  // Fetch all orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    
  // Fetch all trays mapping to Growers
  const { data: trays } = await supabase
    .from("tray_assignments")
    .select("*, profiles_grower:grower_id(full_name, email)")

  // Fetch all active growers to pass to allocation engine
  const { data: growers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "grower")

  // Normalize tray data properly mapping out the grower name join lookup
  const enrichedTrays = (trays || []).map((t: any) => ({
    ...t,
    grower_name: t.profiles_grower?.full_name || t.profiles_grower?.email || "Unknown Grower",
  }))

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Allocation Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Synchronize raw demand against active network production.</p>
      </div>

      <AllocationClient 
        orders={orders || []} 
        trays={enrichedTrays} 
        growers={growers || []} 
      />
    </div>
  )
}
