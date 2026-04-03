import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import SubscriptionManager from "@/components/dashboard/SubscriptionManager"

export default async function RestaurantSubscriptionsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "restaurant") redirect("/login")

  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("restaurant_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching subscriptions:", error)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Manage Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Set up recurring microgreens deliveries</p>
      </div>

      <SubscriptionManager 
        restaurantId={profile.id} 
        existingSubscriptions={subscriptions || []} 
      />
    </div>
  )
}
