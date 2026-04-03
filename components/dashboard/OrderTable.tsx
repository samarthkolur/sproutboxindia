"use client"

import { motion } from "framer-motion"
import type { Order, OrderStatus } from "@/lib/types"
import { useState } from "react"
import { PackageSearch, Hourglass, UserCheck, Sprout, Scissors, CheckCircle } from "lucide-react"

interface OrderTableProps {
  orders: Order[]
  onFeedback?: (orderId: string) => void
}

const statusConfig: Record<OrderStatus, { color: string; label: string; icon: React.ElementType }> = {
  pending: {
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    label: "Pending",
    icon: Hourglass,
  },
  assigned_to_growers: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Assigned to Growers",
    icon: UserCheck,
  },
  growing: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Growing",
    icon: Sprout,
  },
  ready_for_harvest: {
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "Ready for Harvest",
    icon: Scissors,
  },
  delivered: {
    color: "bg-sprout-500/10 text-sprout-400 border-sprout-500/20",
    label: "Delivered",
    icon: CheckCircle,
  },
}

export default function OrderTable({ orders, onFeedback }: OrderTableProps) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all")

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PackageSearch className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-base font-semibold">Your Orders</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {orders.length} total order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "assigned_to_growers", "growing", "ready_for_harvest", "delivered"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filter === s
                    ? "bg-sprout-500/10 text-sprout-400 border border-sprout-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {s === "all" ? "All" : statusConfig[s].label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 pr-4">Items</th>
              <th className="pb-3 pr-4">Trays</th>
              <th className="pb-3 pr-4">Delivery</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground/50">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, i) => {
                const StatusIcon = statusConfig[order.status].icon

                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-muted-foreground">
                        {order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-0.5">
                        {(order.items as { crop_name: string; quantity_kg: number }[]).map(
                          (item, j) => (
                            <span key={j} className="text-xs">
                              {item.crop_name}{" "}
                              <span className="text-muted-foreground">
                                ({item.quantity_kg} kg)
                              </span>
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm font-semibold text-sprout-400">
                        {order.total_trays}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 flex-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                          statusConfig[order.status].color
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {order.status === "delivered" && onFeedback && (
                        <button
                          onClick={() => onFeedback(order.id)}
                          className="text-xs text-sprout-400 hover:text-sprout-300 transition-colors"
                        >
                          Feedback
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
