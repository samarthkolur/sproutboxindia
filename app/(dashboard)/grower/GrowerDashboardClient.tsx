"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Profile, TrayAssignment, Milestone, DailyInstruction, GrowthUpload, TaskStatus } from "@/lib/types"
import TaskCard from "@/components/dashboard/TaskCard"
import MilestoneTracker from "@/components/dashboard/MilestoneTracker"
import DailyInstructions from "@/components/dashboard/DailyInstructions"
import UploadSection from "@/components/dashboard/UploadSection"
import YieldInput from "@/components/dashboard/YieldInput"

// Days when photo uploads are required for QC
const UPLOAD_REQUIRED_DAYS = [3, 6]

interface GrowerDashboardClientProps {
  profile: Profile
  trays: TrayAssignment[]
  milestones: Milestone[]
  instructions: DailyInstruction[]
  uploads: GrowthUpload[]
  error: string | null
}

export default function GrowerDashboardClient({
  profile,
  trays = [],
  milestones = [],
  instructions = [],
  uploads = [],
  error,
}: GrowerDashboardClientProps) {
  const [selectedTray, setSelectedTray] = useState<string | null>(
    trays.find((t) => t.status !== "completed")?.id || trays[0]?.id || null
  )

  const activeTray = trays.find((t) => t.id === selectedTray)
  const trayMilestones = milestones.filter((m) => m.tray_id === selectedTray)
  const trayInstructions = instructions.filter((i) => i.tray_id === selectedTray)
  const trayUploads = uploads.filter((u) => u.tray_id === selectedTray)

  // Stats
  const assignedCount = trays.filter((t) => t.status === "assigned").length
  const growingCount = trays.filter((t) => t.status === "growing" || t.status === "qc_pending").length
  const completedCount = trays.filter((t) => t.status === "completed" || t.status === "approved").length

  // Today's notifications
  const notifications: { type: "warning" | "info" | "action"; message: string }[] = []

  if (activeTray) {
    // Upload required today?
    if (UPLOAD_REQUIRED_DAYS.includes(activeTray.current_day)) {
      const todayUploads = trayUploads.filter((u) => u.day_number === activeTray.current_day)
      if (todayUploads.length < 2) {
        notifications.push({
          type: "action",
          message: `📸 Photo upload required today (Day ${activeTray.current_day}) — QC needs top & side views`,
        })
      }
    }

    // Missed tasks?
    const pastIncomplete = trayInstructions.filter(
      (i) => i.day_number < activeTray.current_day && !i.is_completed
    )
    if (pastIncomplete.length > 0) {
      notifications.push({
        type: "warning",
        message: `⚠ You have ${pastIncomplete.length} missed task${pastIncomplete.length > 1 ? "s" : ""} from previous days`,
      })
    }

    // Daily reminder
    const todayTasks = trayInstructions.filter((i) => i.day_number === activeTray.current_day)
    const todayPending = todayTasks.filter((i) => !i.is_completed)
    if (todayPending.length > 0) {
      notifications.push({
        type: "info",
        message: `💧 ${todayPending.length} task${todayPending.length > 1 ? "s" : ""} pending for today — remember to water your greens!`,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="gradient-text-sprout">Grower OS</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome, {profile.full_name || profile.email || "Grower"} — follow your daily instructions below.
        </p>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ═══ NOTIFICATION BANNER ═══ */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${
                n.type === "warning"
                  ? "border-red-500/20 bg-red-500/[0.06] text-red-400"
                  : n.type === "action"
                    ? "border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-400"
                    : "border-blue-500/20 bg-blue-500/[0.06] text-blue-400"
              }`}
            >
              {n.message}
            </motion.div>
          ))}
        </div>
      )}

      {trays.length === 0 ? (
        /* ═══ EMPTY STATE ═══ */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center"
        >
          <span className="text-5xl">🌱</span>
          <h2 className="mt-4 text-lg font-semibold">No trays assigned yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your admin will assign trays to you soon. Check back later!
          </p>
        </motion.div>
      ) : (
        <>
          {/* ═══ STATS BAR ═══ */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Assigned", value: assignedCount, icon: "📋" },
              { label: "Growing", value: growingCount, icon: "🌱" },
              { label: "Completed", value: completedCount, icon: "✅" },
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

          {/* ═══ TODAY'S TASK HERO ═══ */}
          {activeTray && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-2xl border border-sprout-500/20 bg-gradient-to-br from-sprout-500/[0.08] to-sprout-500/[0.02] p-6 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-sprout-400">
                    Today&apos;s Focus
                  </span>
                  <h2 className="mt-2 text-xl font-bold">{activeTray.crop_name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground font-mono text-xs">
                    Day {activeTray.current_day} of {activeTray.total_days} · Tray {activeTray.tray_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-sprout-400">
                    Day {activeTray.current_day}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Harvest: {new Date(activeTray.expected_harvest_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Growth Progress</span>
                  <span>{Math.round((activeTray.current_day / activeTray.total_days) * 100)}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(activeTray.current_day / activeTray.total_days) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" as const }}
                    className="h-full rounded-full bg-gradient-to-r from-sprout-500 to-sprout-400"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ MILESTONE STEPPER ═══ */}
          {activeTray && (
            <MilestoneTracker
              milestones={trayMilestones}
              currentDay={activeTray.current_day}
            />
          )}

          {/* ═══ SEED USAGE INSTRUCTIONS (DAY 1 FOCUS) ═══ */}
          {activeTray && activeTray.current_day <= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 backdrop-blur-xl"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 shrink-0">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-blue-400">Strict Seed Usage Instructions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Follow exactly to ensure consistent crop yield</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">Seed Type</span>
                      <p className="text-sm font-semibold">{activeTray.seed_type}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">Target Batch</span>
                      <p className="text-sm font-mono text-blue-400 font-semibold">#{activeTray.seed_batch_id}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">Quantity</span>
                      <p className="text-sm font-semibold">{activeTray.seed_quantity_grams}g per tray</p>
                    </div>
                    <div className="space-y-1 col-span-2 mt-1 pt-3 border-t border-blue-500/10">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">Sowing Method</span>
                      <p className="text-sm font-medium">Spread evenly across the flat tray. Ensure zero seed overlap to prevent mold growth during germination.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ DAILY INSTRUCTIONS (PRIMARY) ═══ */}
          {activeTray && (
            <DailyInstructions
              instructions={trayInstructions}
              currentDay={activeTray.current_day}
              uploadRequired={UPLOAD_REQUIRED_DAYS.includes(activeTray.current_day)}
            />
          )}

          {/* ═══ UPLOAD + YIELD ═══ */}
          {activeTray && (
            <div className="grid gap-6 md:grid-cols-2">
              <UploadSection
                trayId={activeTray.id}
                dayNumber={activeTray.current_day}
                existingUploads={trayUploads}
              />
              {activeTray.status === "completed" || activeTray.current_day >= activeTray.total_days ? (
                <YieldInput
                  trayId={activeTray.id}
                  cropName={activeTray.crop_name}
                />
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl">⏳</span>
                  <h3 className="mt-3 text-sm font-semibold">Yield Recording</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Available when harvest is ready on Day {activeTray.total_days}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ OTHER TRAYS ═══ */}
          {trays.length > 1 && (
            <div className="pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your Trays ({trays.length})
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {trays.map((tray) => (
                  <TaskCard
                    key={tray.id}
                    assignment={tray}
                    onSelect={setSelectedTray}
                    isSelected={tray.id === selectedTray}
                    isToday={tray.status !== "completed" && tray.status !== "approved"}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
