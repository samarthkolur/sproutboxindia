import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RestaurantDashboardOverview() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "restaurant") redirect("/login")

  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", profile.id)

  const activeOrders = orders?.filter(o => o.status !== "delivered")?.length || 0
  const totalOrdered = orders?.length || 0

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-sprout-400">Account Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, {profile.full_name || profile.email}.</p>
      </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
           <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Active Deliveries</p>
           <p className="text-3xl font-bold text-sprout-400">{activeOrders}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
           <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Orders</p>
           <p className="text-3xl font-bold">{totalOrdered}</p>
        </div>
      </div>
    </div>
  )
}
