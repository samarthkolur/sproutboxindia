"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { MotionButton } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { OrderItem, SubscriptionFrequency } from "@/lib/types"

const AVAILABLE_CROPS = [
  { name: "Sunflower Microgreens" },
  { name: "Pea Shoots" },
  { name: "Radish Microgreens" },
  { name: "Broccoli Microgreens" },
  { name: "Mustard Microgreens" },
  { name: "Wheatgrass" },
]

const frequencies: { value: SubscriptionFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
]

interface SubscriptionManagerProps {
  restaurantId: string
  existingSubscriptions: {
    id: string
    items: OrderItem[]
    frequency: SubscriptionFrequency
    next_delivery: string
    is_active: boolean
  }[]
}

export default function SubscriptionManager({
  restaurantId,
  existingSubscriptions,
}: SubscriptionManagerProps) {
  const [subs, setSubs] = useState(existingSubscriptions)
  const [creating, setCreating] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState("")
  const [quantity, setQuantity] = useState(0.5)
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("weekly")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!selectedCrop) {
      setError("Select a crop")
      return
    }

    setSubmitting(true)
    setError(null)

    const crop = AVAILABLE_CROPS.find((c) => c.name === selectedCrop)!
    const items: OrderItem[] = [
      { crop_name: crop.name, quantity_kg: quantity },
    ]

    try {
      const supabase = createClient()
      const nextDelivery = new Date()
      nextDelivery.setDate(
        nextDelivery.getDate() + (frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 14)
      )

      const { data, error: dbError } = await supabase
        .from("subscriptions")
        .insert({
          restaurant_id: restaurantId,
          items,
          frequency,
          next_delivery: nextDelivery.toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setSubs((prev) => [data, ...prev])
      setCreating(false)
      setSelectedCrop("")
      setQuantity(0.5)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleSubscription(id: string, isActive: boolean) {
    const supabase = createClient()
    await supabase.from("subscriptions").update({ is_active: !isActive }).eq("id", id)
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s))
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">Subscriptions</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto‑recurring deliveries
          </p>
        </div>
        {!creating && (
          <MotionButton
            variant="glass"
            size="sm"
            onClick={() => setCreating(true)}
          >
            + New
          </MotionButton>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Crop</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-sprout-500/50 backdrop-blur-xl"
            >
              <option value="">Select crop...</option>
              {AVAILABLE_CROPS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Quantity (kg)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0.25}
              step={0.25}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-sprout-500/50 backdrop-blur-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Frequency</label>
            <div className="flex gap-2">
              {frequencies.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    frequency === f.value
                      ? "border-sprout-500/40 bg-sprout-500/10 text-sprout-400"
                      : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <MotionButton
              variant="glass"
              size="sm"
              className="flex-1"
              onClick={() => setCreating(false)}
            >
              Cancel
            </MotionButton>
            <MotionButton
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create"}
            </MotionButton>
          </div>
        </motion.div>
      )}

      {/* Existing subscriptions */}
      <div className="mt-4 space-y-2">
        {subs.length === 0 && !creating && (
          <p className="py-4 text-center text-xs text-muted-foreground/50">
            No active subscriptions
          </p>
        )}
        {subs.map((sub) => (
          <div
            key={sub.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              sub.is_active
                ? "border-sprout-500/15 bg-sprout-500/[0.03]"
                : "border-white/[0.04] bg-white/[0.01] opacity-50"
            }`}
          >
            <div>
              <p className="text-sm font-medium">
                {(sub.items as OrderItem[])[0]?.crop_name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {(sub.items as OrderItem[])[0]?.quantity_kg} kg · {sub.frequency} ·
                Next: {new Date(sub.next_delivery).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => toggleSubscription(sub.id, sub.is_active)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                sub.is_active
                  ? "bg-sprout-500/10 text-sprout-400 hover:bg-red-500/10 hover:text-red-400"
                  : "bg-white/[0.04] text-muted-foreground hover:bg-sprout-500/10 hover:text-sprout-400"
              }`}
            >
              {sub.is_active ? "Pause" : "Resume"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
