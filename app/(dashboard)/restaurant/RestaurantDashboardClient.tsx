"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Profile, Order, OrderItem, SubscriptionFrequency } from "@/lib/types"
import OrderForm from "@/components/dashboard/OrderForm"
import OrderTable from "@/components/dashboard/OrderTable"
import SubscriptionManager from "@/components/dashboard/SubscriptionManager"
import FeedbackForm from "@/components/dashboard/FeedbackForm"

interface RestaurantDashboardClientProps {
  profile: Profile
  orders: Order[]
  subscriptions: {
    id: string
    items: OrderItem[]
    frequency: SubscriptionFrequency
    next_delivery: string
    is_active: boolean
  }[]
  error: string | null
}

export default function RestaurantDashboardClient({
  profile,
  orders: initialOrders,
  subscriptions,
  error,
}: RestaurantDashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"orders" | "subscriptions">("orders")

  // Supply chain stats
  const pendingCount = orders.filter((o) => o.status === "pending").length
  const inProductionCount = orders.filter(
    (o) => o.status === "assigned_to_growers" || o.status === "growing" || o.status === "ready_for_harvest"
  ).length
  const deliveredCount = orders.filter((o) => o.status === "delivered").length

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, <span className="gradient-text-sprout">{profile.full_name || "Partner"}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order fresh microgreens and track your deliveries.
        </p>
      </motion.div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: "📦" },
          { label: "In Production", value: inProductionCount, icon: "🌱" },
          { label: "Delivered", value: deliveredCount, icon: "✅" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl"
          >
            <span className="text-xl">{stat.icon}</span>
            <p className="mt-2 text-xl font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="mt-8 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {(["orders", "subscriptions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-sprout-500/10 text-sprout-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "orders" ? (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <OrderForm
                restaurantId={profile.id}
                onOrderPlaced={() => {
                  // Refresh would happen via revalidation in production
                }}
              />
            </div>
            <div className="lg:col-span-3">
              <OrderTable
                orders={orders}
                onFeedback={(orderId) => setFeedbackOrderId(orderId)}
              />
            </div>
          </div>
        ) : (
          <SubscriptionManager
            restaurantId={profile.id}
            existingSubscriptions={subscriptions}
          />
        )}
      </div>

      {/* Feedback modal */}
      {feedbackOrderId && (
        <FeedbackForm
          orderId={feedbackOrderId}
          restaurantId={profile.id}
          onClose={() => setFeedbackOrderId(null)}
        />
      )}
    </div>
  )
}
