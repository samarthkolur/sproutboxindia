"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/Input"
import { MotionButton } from "@/components/ui/button"
import { Sprout, CheckCircle, X } from "lucide-react"
import type { OrderItem } from "@/lib/types"

const AVAILABLE_CROPS = [
  { name: "Sunflower Microgreens" },
  { name: "Pea Shoots" },
  { name: "Radish Microgreens" },
  { name: "Broccoli Microgreens" },
  { name: "Mustard Microgreens" },
  { name: "Wheatgrass" },
]

// 1 tray ≈ 0.25 kg yield
const KG_PER_TRAY = 0.25

interface OrderFormProps {
  restaurantId: string
  onOrderPlaced?: () => void
}

export default function OrderForm({ restaurantId, onOrderPlaced }: OrderFormProps) {
  const [items, setItems] = useState<(OrderItem & { id: number })[]>([])
  const [deliveryDate, setDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [orderType, setOrderType] = useState<"one_time" | "subscription">("one_time")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addItem(crop: { name: string }) {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), crop_name: crop.name, quantity_kg: 0.5 },
    ])
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateQuantity(id: number, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity_kg: qty } : i))
    )
  }

  const totalKg = items.reduce((sum, i) => sum + i.quantity_kg, 0)
  const totalTrays = Math.ceil(totalKg / KG_PER_TRAY)

  async function handleSubmit() {
    if (items.length === 0) {
      setError("Add at least one item to your order")
      return
    }
    if (!deliveryDate) {
      setError("Please select a delivery date")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const orderItems = items.map(({ crop_name, quantity_kg }) => ({
        crop_name,
        quantity_kg,
      }))

      const { error: dbError } = await supabase.from("orders").insert({
        restaurant_id: restaurantId,
        items: orderItems,
        total_trays: totalTrays,
        delivery_date: deliveryDate,
        notes: notes || null,
        status: "pending",
      })

      if (dbError) throw dbError

      setSuccess(true)
      setItems([])
      setDeliveryDate("")
      setNotes("")
      onOrderPlaced?.()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">Place New Order</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Select your microgreens and set quantities
      </p>

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-sprout-500/30 bg-sprout-500/10 px-3 py-2 text-xs text-sprout-400"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Order placed successfully! Status: Pending</span>
        </motion.div>
      )}

      {/* Order type selector */}
      <div className="mt-4">
        <label className="text-xs font-medium text-muted-foreground">Order type</label>
        <div className="mt-2 flex gap-2">
          {([
            { value: "one_time" as const, label: "One‑Time" },
            { value: "subscription" as const, label: "Subscription" },
          ]).map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setOrderType(type.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                orderType === type.value
                  ? "border-sprout-500/40 bg-sprout-500/10 text-sprout-400"
                  : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        {orderType === "subscription" && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/60">
            Tip: Use the Subscriptions tab to set up recurring deliveries with full schedule control.
          </p>
        )}
      </div>

      {/* Crop selector */}
      <div className="mt-4">
        <label className="text-xs font-medium text-muted-foreground">Add crops</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVAILABLE_CROPS.map((crop) => (
            <button
              key={crop.name}
              type="button"
              onClick={() => addItem(crop)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-sprout-500/30 hover:bg-sprout-500/[0.06] hover:text-sprout-400"
            >
              + {crop.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected items */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-2"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">{item.crop_name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity_kg}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    min={0.25}
                    step={0.25}
                    className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-center text-xs text-foreground outline-none focus:border-sprout-500/50"
                  />
                  <span className="text-[10px] text-muted-foreground">kg</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    ≈ {Math.ceil(item.quantity_kg / KG_PER_TRAY)} trays
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-1 rounded-md p-1.5 border border-transparent text-muted-foreground/40 transition-colors hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
              <span className="text-sm font-semibold">Total</span>
              <div className="text-right">
                <span className="text-base font-bold text-sprout-400">{totalKg.toFixed(2)} kg</span>
                <span className="ml-2 text-xs text-muted-foreground">≈ {totalTrays} trays</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery date + notes */}
      <div className="mt-5 space-y-4">
        <Input
          label="Delivery Date"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          variant="glass"
          min={new Date().toISOString().split("T")[0]}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, preferred delivery time..."
            rows={2}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-sprout-500/50 focus:ring-2 focus:ring-sprout-500/20 backdrop-blur-xl resize-none"
          />
        </div>

        <MotionButton
          variant="primary"
          size="lg"
          className="w-full mt-2"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Placing order…
            </span>
          ) : (
            `Place Order — ${totalKg.toFixed(2)} kg (${totalTrays} trays)`
          )}
        </MotionButton>
      </div>
    </div>
  )
}
