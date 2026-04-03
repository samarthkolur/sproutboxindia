"use client"

import { motion } from "framer-motion"
import type { DailyInstruction } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface DailyInstructionsProps {
  instructions: DailyInstruction[]
  currentDay: number
  uploadRequired?: boolean
}

export default function DailyInstructions({ instructions, currentDay, uploadRequired }: DailyInstructionsProps) {
  const [items, setItems] = useState(instructions)

  async function toggleComplete(id: string, completed: boolean) {
    const supabase = createClient()
    await supabase
      .from("daily_instructions")
      .update({ is_completed: !completed })
      .eq("id", id)

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_completed: !completed } : item
      )
    )
  }

  const todayInstructions = items.filter((i) => i.day_number === currentDay)
  const pastInstructions = items.filter((i) => i.day_number < currentDay)
  const upcomingInstructions = items.filter((i) => i.day_number > currentDay)

  const todayAllDone = todayInstructions.length > 0 && todayInstructions.every((i) => i.is_completed)

  // Group past by day for collapsed view
  const pastDays = [...new Set(pastInstructions.map((i) => i.day_number))].sort((a, b) => b - a)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">📋 Today&apos;s Instructions</h3>
          <p className="mt-1 text-xs text-muted-foreground">Day {currentDay} — Follow each step carefully</p>
        </div>
        {todayAllDone && (
          <span className="rounded-full bg-sprout-500/10 border border-sprout-500/20 px-3 py-1 text-xs font-semibold text-sprout-400">
            ✓ All Done
          </span>
        )}
      </div>

      {/* Upload reminder */}
      {uploadRequired && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] px-3 py-2"
        >
          <span className="text-sm">📸</span>
          <p className="text-xs font-medium text-yellow-400">Photo upload required today — scroll down to upload</p>
        </motion.div>
      )}

      {/* Today's tasks — PROMINENT */}
      {todayInstructions.length > 0 ? (
        <div className="mt-5">
          <div className="space-y-2">
            {todayInstructions.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                  item.is_completed
                    ? "border-sprout-500/15 bg-sprout-500/[0.03]"
                    : "border-white/[0.08] bg-white/[0.03] shadow-sm"
                }`}
              >
                <button
                  onClick={() => toggleComplete(item.id, item.is_completed)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                    item.is_completed
                      ? "border-sprout-500 bg-sprout-500"
                      : "border-white/[0.20] hover:border-sprout-500/50"
                  }`}
                >
                  {item.is_completed && (
                    <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {!item.is_completed && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                    Pending
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 text-center">
          <span className="text-2xl">✅</span>
          <p className="mt-2 text-sm font-medium">No tasks for today</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Check back tomorrow for next instructions</p>
        </div>
      )}

      {/* Upcoming preview */}
      {upcomingInstructions.length > 0 && (
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">Coming Up</span>
          <div className="mt-2 space-y-1.5 opacity-40">
            {upcomingInstructions.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/[0.10]">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/[0.15]" />
                </div>
                <div>
                  <p className="text-xs font-medium">Day {item.day_number}: {item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past days — collapsed */}
      {pastDays.length > 0 && (
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">Completed Days</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {pastDays.map((day) => {
              const dayTasks = pastInstructions.filter((i) => i.day_number === day)
              const allDone = dayTasks.every((i) => i.is_completed)
              return (
                <div
                  key={day}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                    allDone
                      ? "border-sprout-500/15 text-sprout-400/60"
                      : "border-yellow-500/15 text-yellow-400/60"
                  }`}
                >
                  {allDone ? "✓" : "!"} Day {day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
