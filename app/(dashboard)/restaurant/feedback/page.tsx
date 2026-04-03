import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import FeedbackPageClient from "./FeedbackPageClient"

export default async function RestaurantFeedbackPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "restaurant") redirect("/login")

  const supabase = await createClient()

  // Find all delivered orders that *don't* have feedback yet
  // We can do this efficiently by fetching all orders and feedback and diffing, or using a subquery.
  // We'll fetch all delivered orders, and all feedback, and diff in the client.
  const { data: deliveredOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", profile.id)
    .eq("status", "delivered")
    .order("updated_at", { ascending: false })

  const { data: feedbackData } = await supabase
    .from("feedback")
    .select("*")
    .eq("restaurant_id", profile.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Order Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your completed deliveries and past feedback.</p>
      </div>

      <FeedbackPageClient 
        restaurantId={profile.id} 
        orders={deliveredOrders || []} 
        feedback={feedbackData || []} 
      />
    </div>
  )
}
