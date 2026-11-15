"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Modal } from "@/components/ui/modal";
import { controlClass } from "@/components/ui/field";
import { trackGrowerEngagement } from "@/lib/gtag";
import { cn } from "@/lib/utils";
import { actionButtonClass, type ActionTone } from "./action-button";

export function CheckinModal({ batchId, day, tone = "solid" }: { batchId: string; day: number; tone?: ActionTone }) {
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

  const uploading = topUploading || sideUploading;

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

  function close() {
    if (submitting) return;
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <button type="button" data-no-global-loading className={actionButtonClass(tone)} onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" aria-hidden="true" />
        Check in
      </button>

      <Modal
        open={open}
        onClose={close}
        dismissible={!submitting && !success}
        title={`Day ${day} check-in`}
        description="Upload a top view and a side view of your tray."
        footer={
          success ? null : (
            <>
              <button
                type="button"
                data-no-global-loading
                onClick={close}
                disabled={submitting}
                className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                data-no-global-loading
                disabled={submitting || uploading}
                onClick={submit}
                className={cn(actionButtonClass("solid"), "min-w-[9rem]")}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Submitting…
                  </>
                ) : uploading ? (
                  "Uploading photos…"
                ) : (
                  "Submit check-in"
                )}
              </button>
            </>
          )
        }
      >
        {success ? (
          <div className="py-8 text-center" role="status">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-soft">
              <CheckCircle2 className="h-8 w-8 text-good" aria-hidden="true" />
            </div>
            <p className="font-medium text-ink">Check-in submitted</p>
            <p className="mt-1 text-sm text-ink-soft">Your progress has been recorded.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <ImageUploader label="Top view" endpoint="growerCheckin" onChange={setTop} onUploadingChange={setTopUploading} />
              <ImageUploader label="Side view" endpoint="growerCheckin" onChange={setSide} onUploadingChange={setSideUploading} />
            </div>

            <label htmlFor={`notes-${batchId}`} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
              <span>Notes</span>
              <span className="text-micro font-normal text-ink-muted">Optional</span>
            </label>
            <textarea
              id={`notes-${batchId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations about growth today…"
              rows={2}
              className={cn(controlClass, "resize-none")}
            />

            {error && (
              <p role="alert" className="mt-4 rounded-tile bg-risk-soft px-3 py-2 text-sm font-medium text-risk">
                {error}
              </p>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
