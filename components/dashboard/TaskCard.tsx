"use client"

import { motion } from "framer-motion"
import type { TrayAssignment, TaskStatus } from "@/lib/types"
import { ClipboardList, Sprout, SearchCheck, CheckCircle2, PartyPopper } from "lucide-react"

interface TaskCardProps {
  assignment: TrayAssignment
  onSelect?: (id: string) => void
  isSelected?: boolean
  isToday?: boolean
}

const statusConfig: Record<TaskStatus, { color: string; label: string; icon: React.ElementType }> = {
  assigned: {
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    label: "Assigned",
    icon: ClipboardList,
  },
  growing: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Growing",
    icon: Sprout,
  },
  qc_pending: {
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "QC Pending",
    icon: SearchCheck,
  },
  approved: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Approved",
    icon: CheckCircle2,
  },
  completed: {
    color: "bg-sprout-500/10 text-sprout-400 border-sprout-500/20",
    label: "Completed",
    icon: PartyPopper,
  },
}

export default function TaskCard({ assignment, onSelect, isSelected, isToday }: TaskCardProps) {
  const progressPercent = Math.round((assignment.current_day / assignment.total_days) * 100)
  const config = statusConfig[assignment.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect?.(assignment.id)}
      className={`cursor-pointer rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 ${
        isSelected
          ? "border-sprout-500/30 bg-sprout-500/[0.06] shadow-lg shadow-sprout-500/10"
          : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.10] hover:bg-white/[0.04]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{assignment.crop_name}</p>
            {isToday && (
              <span className="rounded-full bg-sprout-500/10 border border-sprout-500/20 px-2 py-0.5 text-[10px] font-bold text-sprout-400 animate-pulse">
                ACTIVE
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">{assignment.tray_code}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Day {assignment.current_day} of {assignment.total_days}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="h-full rounded-full bg-gradient-to-r from-sprout-500 to-sprout-400"
          />
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-white/[0.06] pt-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sprout-400">Batch #{assignment.seed_batch_id}</span>
          <span>{assignment.seed_quantity_grams}g of {assignment.seed_type}</span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span>Sown: {new Date(assignment.start_date).toLocaleDateString()}</span>
          <span>Harvest: {new Date(assignment.expected_harvest_date).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  )
}
