"use client"

import { useState } from "react"
import type { Order } from "@/lib/types"
import OrderTable from "@/components/dashboard/OrderTable"
import FeedbackForm from "@/components/dashboard/FeedbackForm"

interface OrdersClientProps {
  orders: Order[]
  restaurantId: string
}

export default function OrdersClient({ orders, restaurantId }: OrdersClientProps) {
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null)

  return (
    <>
      <OrderTable 
        orders={orders} 
        onFeedback={(id) => setFeedbackOrderId(id)} 
      />

      {feedbackOrderId && (
        <FeedbackForm
          orderId={feedbackOrderId}
          restaurantId={restaurantId}
          onClose={() => setFeedbackOrderId(null)}
          onSubmitted={() => {
            setFeedbackOrderId(null)
            // Optional: Show toast or reload page to update state
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
