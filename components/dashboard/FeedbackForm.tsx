"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { MotionButton } from "@/components/ui/button"

interface FeedbackFormProps {
  orderId: string
  restaurantId: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function FeedbackForm({
  orderId,
  restaurantId,
  onClose,
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(4)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from("feedback").insert({
        order_id: orderId,
        restaurant_id: restaurantId,
        rating,
        comment: comment || null,
      })

      if (dbError) throw dbError
      onSubmitted?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-card p-6 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leave Feedback</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Order #{orderId.slice(0, 8)}
          </p>

          {error && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Star rating */}
          <div className="mt-5 space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform ${
                    star <= rating ? "scale-110" : "opacity-30 hover:opacity-60"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mt-4 space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the quality, freshness, packaging?"
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-sprout-500/50 focus:ring-2 focus:ring-sprout-500/20 backdrop-blur-xl resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <MotionButton
              variant="glass"
              size="default"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </MotionButton>
            <MotionButton
              variant="primary"
              size="default"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit"}
            </MotionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
