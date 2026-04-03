"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/Input"
import { MotionButton } from "@/components/ui/button"
import { Scale, Star, PartyPopper } from "lucide-react"

interface YieldInputProps {
  trayId: string
  cropName: string
}

export default function YieldInput({ trayId, cropName }: YieldInputProps) {
  const [weight, setWeight] = useState("")
  const [quality, setQuality] = useState(3)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!weight || isNaN(Number(weight))) {
      setError("Please enter a valid weight")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from("yield_records").insert({
        tray_id: trayId,
        weight_grams: Number(weight),
        quality_rating: quality,
        notes: notes || null,
      })

      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yield")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-sprout-500/20 bg-sprout-500/[0.06] p-6 text-center backdrop-blur-xl"
      >
        <div className="flex justify-center mb-3">
          <div className="rounded-full bg-sprout-500/20 p-4">
             <PartyPopper className="h-8 w-8 text-sprout-400" />
          </div>
        </div>
        <h3 className="mt-2 text-lg font-bold">Yield Recorded!</h3>
        <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-2">
          {weight}g of {cropName} — Quality: 
          <span className="flex">
            {Array.from({ length: quality }).map((_, i) => (
               <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </span>
        </p>
      </motion.div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">Record Yield</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground mb-4">
        Log your harvest for {cropName}
      </p>

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-4">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <Input
          label="Weight (grams)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 250"
          variant="glass"
        />

        {/* Quality rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Quality Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                type="button"
                onClick={() => setQuality(starValue)}
                className={`transition-all p-2 rounded-xl border ${
                  starValue <= quality 
                    ? "border-yellow-500/40 bg-yellow-500/10 scale-110 shadow-lg shadow-yellow-500/10" 
                    : "border-white/10 bg-white/5 opacity-50 hover:bg-white/10 hover:opacity-100"
                }`}
              >
                <Star className={`h-5 w-5 ${starValue <= quality ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about the harvest..."
            rows={2}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-sprout-500/50 focus:ring-2 focus:ring-sprout-500/20 backdrop-blur-xl resize-none"
          />
        </div>

        <MotionButton
          variant="primary"
          size="default"
          className="w-full mt-2"
          onClick={handleSubmit}
          disabled={submitting || !weight}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Recording…
            </span>
          ) : (
            "Record Yield"
          )}
        </MotionButton>
      </div>
    </div>
  )
}
