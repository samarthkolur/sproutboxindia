"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackGrowerEngagement } from "@/lib/gtag";

export function CheckinModal({ batchId, day }: { batchId: string; day: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState("");
  const [side, setSide] = useState("");
  const [topUploading, setTopUploading] = useState(false);
  const [sideUploading, setSideUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/grower/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          day,
          imageTopUrl: top || undefined,
          imageSideUrl: side || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Submission failed");
      }
      trackGrowerEngagement("checkin_submitted", { batch_id: batchId, day });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setTop("");
        setSide("");
        setNotes("");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (!submitting) {
      setOpen(false);
      setError(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="bg-sprout-800 text-white hover:bg-sprout-900 text-xs px-3 py-1.5 h-auto"
        onClick={() => setOpen(true)}
      >
        Check In
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-text-primary">
                  Day {day} Check-In
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  Upload top and side view photos of your tray
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-sprout-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-sprout-700" />
                </div>
                <p className="font-semibold text-text-primary">Check-in submitted!</p>
                <p className="text-sm text-text-muted mt-1">Your progress has been recorded.</p>
              </div>
            ) : (
              <>
                {/* Image uploaders */}
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <ImageUploader
                    label="Top View"
                    endpoint="growerCheckin"
                    onChange={setTop}
                    onUploadingChange={setTopUploading}
                  />
                  <ImageUploader
                    label="Side View"
                    endpoint="growerCheckin"
                    onChange={setSide}
                    onUploadingChange={setSideUploading}
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations about growth today..."
                    rows={2}
                    className="w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sprout-500/30 focus:border-sprout-600 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200/50 rounded-xl px-3 py-2 mb-4">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting || topUploading || sideUploading}
                    className="bg-sprout-800 text-white hover:bg-sprout-900 flex items-center gap-2"
                    onClick={submit}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                      </>
                    ) : topUploading || sideUploading ? (
                      "Uploading photos…"
                    ) : (
                      "Submit Check-In"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
