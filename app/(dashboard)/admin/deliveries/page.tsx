import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import DeliveriesClient from "./DeliveriesClient"

export default async function AdminDeliveriesPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") redirect("/login")

  const supabase = await createClient()

  // Fetch orders targeted directly at latest operational completion phases
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles_restaurant:restaurant_id(full_name, email)")
    .in("status", ["ready_for_harvest", "growing", "delivered", "assigned_to_growers"])
    .order("delivery_date", { ascending: true })

  const enrichedOrders = (orders || []).map((o: any) => ({
    ...o,
    restaurant_name: o.profiles_restaurant?.full_name || o.profiles_restaurant?.email || "Unknown Restaurant",
  }))

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Logistics & Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time status of outgoing yields and dispatching metrics.</p>
      </div>

      <DeliveriesClient orders={enrichedOrders} />
    </div>
  )
}
