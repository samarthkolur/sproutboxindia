"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, MessageSquare } from "lucide-react"
import type { Order } from "@/lib/types"
import FeedbackForm from "@/components/dashboard/FeedbackForm"
import { MotionButton } from "@/components/ui/button"

interface FeedbackRecord {
  id: string
  order_id: string
  rating: number
  comment: string | null
  created_at: string
}

interface FeedbackPageClientProps {
  restaurantId: string
  orders: Order[]
  feedback: FeedbackRecord[]
}

export default function FeedbackPageClient({ restaurantId, orders, feedback }: FeedbackPageClientProps) {
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null)

  // Find delivered orders that don't have a feedback record yet
  const feedbackOrderIds = new Set(feedback.map((f) => f.order_id))
  const pendingOrders = orders.filter((o) => !feedbackOrderIds.has(o.id))

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Feedback */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <h3 className="text-base font-semibold">Pending Feedback</h3>
          <p className="mt-1 text-xs text-muted-foreground">Orders awaiting your review</p>

          <div className="mt-4 space-y-3">
            {pendingOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/50 border border-dashed border-white/10 rounded-xl">
                You're all caught up!
              </p>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-sprout-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Delivered: {new Date(order.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <MotionButton
                    variant="glass"
                    size="sm"
                    onClick={() => setFeedbackOrderId(order.id)}
                    className="text-sprout-400 border-sprout-500/20 hover:bg-sprout-500/10"
                  >
                    Review
                  </MotionButton>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Feedback */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">Feedback History</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Reviews you have submitted previously.</p>

          <div className="mt-4 space-y-3">
            {feedback.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/50 border border-dashed border-white/10 rounded-xl">
                No feedback history
              </p>
            ) : (
              feedback.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-muted-foreground/70">Order #{item.order_id.slice(0, 8)}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  {item.comment && (
                    <p className="mt-2 text-sm text-foreground/90 italic border-l-2 border-sprout-500/50 pl-3">"{item.comment}"</p>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground/50">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {feedbackOrderId && (
          <FeedbackForm
            orderId={feedbackOrderId}
            restaurantId={restaurantId}
            onClose={() => setFeedbackOrderId(null)}
            onSubmitted={() => {
              setFeedbackOrderId(null)
              window.location.reload()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
