import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import DemandClient from "./DemandClient"

export default async function AdminDemandPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")

  const supabase = await createClient()

  // Fetch all orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles_restaurant:restaurant_id(full_name, email)")
    .order("created_at", { ascending: false })

  // Clean data structure safely handling the join
  const enrichedOrders = (orders || []).map((o: any) => ({
    ...o,
    restaurant_name: o.profiles_restaurant?.full_name || o.profiles_restaurant?.email || "Unknown Restaurant",
  }))

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Demand & Order Approval</h1>
        <p className="text-sm text-muted-foreground mt-1">Review incoming network demands and authorize shipments.</p>
      </div>

      <DemandClient initialOrders={enrichedOrders} />
    </div>
  )
}
