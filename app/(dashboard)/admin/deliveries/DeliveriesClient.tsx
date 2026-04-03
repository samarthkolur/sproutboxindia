"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Truck, CheckCircle, PackageOpen, ArrowRight } from "lucide-react"

export default function DeliveriesClient({ orders: initialOrders }: { orders: any[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [processing, setProcessing] = useState<string | null>(null)

  const readyOrders = orders.filter(o => o.status === "ready_for_harvest")
  const deliveredOrders = orders.filter(o => o.status === "delivered")
  const enRouteOrders = orders.filter(o => o.status === "dispatched" || o.status === "growing" || o.status === "assigned_to_growers") // Fallback mapping for dispatched UI

  async function markDelivered(id: string) {
    setProcessing(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", id)
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "delivered" } : o))
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Ready to Ship */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-4 border-b border-blue-500/20 pb-3">
            <PackageOpen className="h-5 w-5" />
            <h3 className="font-semibold">Ready for Dispatch</h3>
            <span className="ml-auto bg-blue-500/20 text-xs px-2 py-0.5 rounded-full">{readyOrders.length}</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {readyOrders.map((o) => (
                <motion.div key={o.id} layout exit={{ opacity: 0, scale: 0.9 }} className="p-4 rounded-xl border border-white/10 bg-black/40">
                  <p className="text-sm font-medium">{o.restaurant_name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">#{o.id.slice(0,8)} • {o.total_trays} Trays</p>
                  <button 
                    disabled={processing === o.id}
                    onClick={() => markDelivered(o.id)}
                    className="w-full mt-3 bg-sprout-500/20 hover:bg-sprout-500/30 text-sprout-400 border border-sprout-500/30 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    Confirm Delivery <ArrowRight className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {readyOrders.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">No orders currently ready</p>}
          </div>
        </div>

        {/* COLUMN 2: In Production / Dispatched pipeline view */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-4 border-b border-purple-500/20 pb-3">
            <Truck className="h-5 w-5" />
            <h3 className="font-semibold">In Production Network</h3>
            <span className="ml-auto bg-purple-500/20 text-xs px-2 py-0.5 rounded-full">{enRouteOrders.length}</span>
          </div>

          <div className="space-y-3">
            {enRouteOrders.map((o) => (
              <div key={o.id} className="p-4 rounded-xl border border-white/10 bg-black/40">
                <p className="text-sm font-medium opacity-80">{o.restaurant_name}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground font-mono">#{o.id.slice(0,8)}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">{o.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
            {enRouteOrders.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Network clear</p>}
          </div>
        </div>

        {/* COLUMN 3: Delivered */}
        <div className="rounded-2xl border border-sprout-500/20 bg-sprout-500/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sprout-400 mb-4 border-b border-sprout-500/20 pb-3">
            <CheckCircle className="h-5 w-5" />
            <h3 className="font-semibold">Successfully Delivered</h3>
            <span className="ml-auto bg-sprout-500/20 text-xs px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
          </div>

          <div className="space-y-3 opacity-70">
            <AnimatePresence>
              {deliveredOrders.map((o) => (
                <motion.div key={o.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-sprout-500/20 bg-sprout-500/10">
                  <p className="text-sm font-medium text-sprout-400">{o.restaurant_name}</p>
                  <p className="text-xs text-sprout-400/70 mt-1">{o.total_trays} Trays • {new Date(o.delivery_date).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {deliveredOrders.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">No deliveries on record</p>}
          </div>
        </div>

      </div>
    </div>
  )
}
