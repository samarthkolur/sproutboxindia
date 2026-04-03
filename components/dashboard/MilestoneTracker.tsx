"use client"

import { motion } from "framer-motion"
import type { Milestone } from "@/lib/types"
import { Circle, Sprout, Leaf, Scissors, Package, Rocket, Check } from "lucide-react"

interface MilestoneTrackerProps {
  milestones: Milestone[]
  currentDay: number
}

// Default milestones if none come from DB
const DEFAULT_PHASES = [
  { title: "Sowing", icon: Circle, day: 1 },
  { title: "Sprouting", icon: Sprout, day: 3 },
  { title: "Growth", icon: Leaf, day: 5 },
  { title: "Pre-harvest", icon: Scissors, day: 6 },
  { title: "Harvest", icon: Package, day: 7 },
]

export default function MilestoneTracker({ milestones, currentDay }: MilestoneTrackerProps) {
  // Use DB milestones if available, else defaults
  const phases = milestones.length > 0
    ? milestones.map((m) => ({
        title: m.title,
        icon: m.day_number <= 1 ? Circle : m.day_number <= 3 ? Sprout : m.day_number <= 5 ? Leaf : m.day_number <= 6 ? Scissors : Package,
        day: m.day_number,
        status: m.status,
        description: m.description,
      }))
    : DEFAULT_PHASES.map((p) => ({
        ...p,
        status: currentDay > p.day ? ("completed" as const) : currentDay === p.day ? ("active" as const) : ("upcoming" as const),
        description: "",
      }))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5 text-sprout-400" />
        <h3 className="text-base font-semibold">Growth Progress</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Batch lifecycle milestones</p>

      {/* Horizontal stepper */}
      <div className="mt-5 overflow-x-auto">
        <div className="relative flex items-start min-w-[500px]">
          {/* Connector line */}
          <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-white/[0.06]" />

          {/* Progress line */}
          {(() => {
            const completedCount = phases.filter((p) => p.status === "completed" || currentDay > p.day).length
            const activeIndex = phases.findIndex((p) => p.status === "active" || currentDay === p.day)
            const progress = activeIndex >= 0
              ? ((activeIndex + 0.5) / phases.length) * 100
              : (completedCount / phases.length) * 100
            return (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" as const }}
                className="absolute top-[18px] left-[18px] h-0.5 bg-gradient-to-r from-sprout-500 to-sprout-400"
              />
            )
          })()}

          {phases.map((phase, i) => {
            const isCompleted = phase.status === "completed" || currentDay > phase.day
            const isActive = phase.status === "active" || currentDay === phase.day
            const isUpcoming = !isCompleted && !isActive
            const Icon = phase.icon

            return (
              <div
                key={phase.title}
                className="relative flex flex-1 flex-col items-center"
              >
                {/* Node */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition-all ${
                    isCompleted
                      ? "border-sprout-500 bg-sprout-500 shadow-md shadow-sprout-500/20"
                      : isActive
                        ? "border-sprout-400 bg-background shadow-lg shadow-sprout-500/30"
                        : "border-white/[0.12] bg-background"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <div className={isActive ? "animate-pulse" : "opacity-40"}>
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>

                {/* Label */}
                <p className={`mt-2 text-center text-[11px] font-semibold leading-tight ${
                  isCompleted ? "text-sprout-400" : isActive ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {phase.title}
                </p>
                <p className={`mt-0.5 text-[10px] ${
                  isActive ? "text-sprout-400 font-medium" : "text-muted-foreground/30"
                }`}>
                  Day {phase.day}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
