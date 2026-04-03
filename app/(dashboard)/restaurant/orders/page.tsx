import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import OrdersClient from "./OrdersClient"

export default async function RestaurantOrdersPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "restaurant") redirect("/login")

  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", profile.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Order Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Track history and live status of your yields.</p>
      </div>

      <OrdersClient orders={orders || []} restaurantId={profile.id} />
    </div>
  )
}
