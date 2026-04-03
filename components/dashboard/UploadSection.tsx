"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { MotionButton } from "@/components/ui/button"
import { Camera, AlertTriangle, CheckCircle, ArrowUp, FlipHorizontal } from "lucide-react"

// Days when photo uploads are required
const UPLOAD_REQUIRED_DAYS = [3, 6]

interface UploadSectionProps {
  trayId: string
  dayNumber: number
  existingUploads?: { id: string; image_url: string; notes: string | null; uploaded_at: string; day_number: number }[]
}

export default function UploadSection({ trayId, dayNumber, existingUploads = [] }: UploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [uploads, setUploads] = useState(existingUploads)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"top" | "side">("top")
  const fileRef = useRef<HTMLInputElement>(null)

  const isUploadDay = UPLOAD_REQUIRED_DAYS.includes(dayNumber)
  const todayUploads = uploads.filter((u) => u.day_number === dayNumber)
  const hasTopView = todayUploads.some((u) => u.notes?.includes("[top-view]"))
  const hasSideView = todayUploads.some((u) => u.notes?.includes("[side-view]"))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${trayId}/${dayNumber}/${viewType}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("growth-images")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("growth-images")
        .getPublicUrl(fileName)

      const noteWithTag = `[${viewType}-view] ${notes}`.trim()

      const { data: record, error: dbError } = await supabase
        .from("growth_uploads")
        .insert({
          tray_id: trayId,
          day_number: dayNumber,
          image_url: urlData.publicUrl,
          notes: noteWithTag,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploads((prev) => [record, ...prev])
      setPreview(null)
      setNotes("")
      if (fileRef.current) fileRef.current.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">Growth Photos</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Day {dayNumber} — {isUploadDay ? "Photo upload required today" : "Upload photos to track progress"}
      </p>

      {/* Upload day alert */}
      {isUploadDay && (!hasTopView || !hasSideView) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] px-3 py-2"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-yellow-400">
            Required for QC: Upload {!hasTopView && !hasSideView ? "top view & side view" : !hasTopView ? "top view" : "side view"}
          </p>
        </motion.div>
      )}

      {/* Upload completion for today */}
      {isUploadDay && hasTopView && hasSideView && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-sprout-500/20 bg-sprout-500/[0.06] px-3 py-2"
        >
           <CheckCircle className="h-4 w-4 text-sprout-400" />
           <p className="text-xs font-medium text-sprout-400">Both views uploaded — QC photos complete for today</p>
        </motion.div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* View type selector */}
      <div className="mt-5">
        <label className="text-xs font-medium text-muted-foreground">Photo type</label>
        <div className="mt-2 flex gap-2">
          {([
            { value: "top" as const, label: "Top View", icon: ArrowUp, done: hasTopView },
            { value: "side" as const, label: "Side View", icon: FlipHorizontal, done: hasSideView },
          ]).map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setViewType(type.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  viewType === type.value
                    ? "border-sprout-500/40 bg-sprout-500/10 text-sprout-400"
                    : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12] hover:bg-white/[0.02]"
                }`}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span>
                  {type.label}
                  {type.done && " ✓"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upload area */}
      <div className="mt-4 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.08] p-6 transition-all hover:border-sprout-500/30 hover:bg-white/[0.02]"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-32 w-auto rounded-lg object-cover shadow-lg border border-white/10" />
          ) : (
            <>
              <div className="p-3 bg-white/5 rounded-full group-hover:bg-sprout-500/10 transition-colors">
                <Camera className="h-6 w-6 text-muted-foreground group-hover:text-sprout-400" />
              </div>
              <p className="mt-3 text-sm font-medium">Tap to capture {viewType} view</p>
              <p className="mt-1 text-xs text-muted-foreground tracking-wide">SVG, PNG, JPG or WEBP</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: observations about growth..."
          rows={2}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-sprout-500/50 focus:ring-2 focus:ring-sprout-500/20 backdrop-blur-xl resize-none"
        />

        <MotionButton
          variant="primary"
          size="default"
          className="w-full"
          onClick={handleUpload}
          disabled={!preview || uploading}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Uploading…
            </span>
          ) : (
             `Upload ${viewType === "top" ? "Top" : "Side"} View`
          )}
        </MotionButton>
      </div>

      {/* Previous uploads */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-3 pt-6 border-t border-white/[0.06]"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">History</p>
            <div className="grid grid-cols-3 gap-3">
              {uploads.slice(0, 6).map((upload) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/20 transition-colors"
                >
                  <img
                    src={upload.image_url}
                    alt="Growth"
                    className="h-24 w-full object-cover"
                  />
                  <div className="px-2 py-1.5 bg-black/40 backdrop-blur-sm">
                    <p className="text-[10px] text-muted-foreground/80 font-medium tracking-wide">DAY {upload.day_number}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
