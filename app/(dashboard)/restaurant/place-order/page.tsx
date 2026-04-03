import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import OrderForm from "@/components/dashboard/OrderForm"

export default async function RestaurantPlaceOrderPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "restaurant") redirect("/login")

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Place New Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Specify your microgreens and target delivery date.</p>
      </div>

      <div className="max-w-2xl">
        <OrderForm restaurantId={profile.id} />
      </div>
    </div>
  )
}

