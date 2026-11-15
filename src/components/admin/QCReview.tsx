"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { PhotoLightbox, type LightboxImage } from "@/components/ui/photo-lightbox";
import { StatusChip } from "@/components/ui/status-chip";
import { QC_REASONS, composeQcNotes, cropName, decisionError, type QcDecision } from "@/lib/admin";
import { cn } from "@/lib/utils";

export interface ReviewCheckIn {
  id: string;
  day: number;
  imageTopUrl: string | null;
  imageSideUrl: string | null;
  notes: string | null;
  qcResult: string | null;
  qcNotes: string | null;
  /** ISO string: this crosses the server/client boundary. */
  createdAt: string;
}

export interface ReviewItem {
  batchId: string;
  trayNumber: number;
  cropType: string;
  growerName: string;
  /** Only a tray waiting for QC can be passed or rejected. */
  reviewable: boolean;
  /** Newest first. */
  checkIns: ReviewCheckIn[];
}

// The review panel: the photos of a check-in large, the strip of every check-in the tray has
// had, the grower's note, and the decision bar. The decision bar is the only solid-accent area
// on the page (V1), so the eye goes straight to it. Used by the queue and by the batch page.
export function QCReview({
  item,
  onDecide,
  busy,
}: {
  item: ReviewItem;
  /** Resolves true when the verdict was saved, so the form can reset. */
  onDecide: (result: QcDecision, notes: string, checkInId: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const current = item.checkIns.find((c) => c.id === selectedId) ?? item.checkIns[0];
  const latest = item.checkIns[0];
  const images: LightboxImage[] = [];
  if (current?.imageTopUrl) images.push({ src: current.imageTopUrl, alt: `Day ${current.day}, top view` });
  if (current?.imageSideUrl) images.push({ src: current.imageSideUrl, alt: `Day ${current.day}, side view` });

  async function decide(result: QcDecision) {
    const notes = composeQcNotes(reasons, text);
    const problem = decisionError(result, notes);
    setError(problem);
    if (problem || !latest) return;
    if (await onDecide(result, notes, latest.id)) {
      setReasons([]);
      setText("");
      setSelectedId(null);
    }
  }

  if (!current) return <p className="text-sm text-ink-muted">This tray has no check-ins yet.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-medium text-ink">{item.growerName}</h2>
          <p className="text-sm text-ink-soft">{`${cropName(item.cropType)} · Tray ${item.trayNumber}`}</p>
        </div>
        {latest?.qcResult ? <StatusChip status={latest.qcResult} /> : <StatusChip status="QC_PENDING" />}
      </div>

      {/* The check-ins this tray has had, so the reviewer can see how it grew. */}
      <div role="tablist" aria-label="Check-in days" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {[...item.checkIns].reverse().map((checkIn) => (
          <button
            key={checkIn.id}
            type="button"
            role="tab"
            aria-selected={checkIn.id === current.id}
            data-no-global-loading
            onClick={() => setSelectedId(checkIn.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
              checkIn.id === current.id ? "border-transparent bg-inset text-ink" : "border-hairline bg-panel/60 text-ink-soft hover:text-ink"
            )}
          >
            {`Day ${checkIn.day}`}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {([["Top view", current.imageTopUrl], ["Side view", current.imageSideUrl]] as const).map(([label, url]) => (
          <figure key={label}>
            {url ? (
              <button
                type="button"
                data-no-global-loading
                onClick={() => setLightbox(images.findIndex((i) => i.src === url))}
                aria-label={`Enlarge ${label.toLowerCase()}`}
                className="block w-full overflow-hidden rounded-tile bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${label}, day ${current.day}`} className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.02] motion-reduce:transition-none" />
              </button>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-tile bg-inset text-sm text-ink-muted">No photo</div>
            )}
            <figcaption className="mt-1 text-micro text-ink-muted">{label}</figcaption>
          </figure>
        ))}
      </div>

      {current.notes ? (
        <blockquote className="mt-3 rounded-tile bg-inset/60 px-3 py-2 text-sm text-ink-soft">
          <span className="block text-micro font-medium text-ink-muted">Grower&apos;s note</span>
          {current.notes}
        </blockquote>
      ) : null}
      {current.qcResult ? (
        <p className="mt-3 text-sm text-ink-soft">
          <span className="font-medium text-ink">Earlier review: </span>
          <StatusChip status={current.qcResult} className="align-middle" />
          {current.qcNotes ? <span className="ml-2">{current.qcNotes}</span> : null}
        </p>
      ) : null}

      {item.reviewable ? (
        <div className="mt-5 rounded-panel bg-brand p-4 text-brand-ink sm:p-5">
          <p className="text-sm font-medium">Decision for the latest check-in</p>

          <fieldset className="mt-3">
            <legend className="sr-only">Reasons</legend>
            <div className="flex flex-wrap gap-2">
              {QC_REASONS.map((reason) => {
                const on = reasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    data-no-global-loading
                    aria-pressed={on}
                    onClick={() => setReasons((cur) => (on ? cur.filter((r) => r !== reason) : [...cur, reason]))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/60",
                      on ? "border-transparent bg-brand-ink text-brand" : "border-brand-ink/40 text-brand-ink hover:bg-brand-ink/10"
                    )}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label htmlFor="qc-notes" className="sr-only">
            Note to the grower
          </label>
          <textarea
            id="qc-notes"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            placeholder="Note to the grower (shown with the result)"
            className={cn(controlClass, "mt-3 resize-none !bg-brand-ink/10 !text-brand-ink placeholder:!text-brand-ink/60")}
          />

          {error ? (
            <p role="alert" className="mt-3 text-sm font-medium">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { result: "PASS" as const, label: "Pass", key: "P", icon: CheckCircle2 },
              { result: "RISK" as const, label: "Flag as risk", key: "R", icon: AlertTriangle },
              { result: "REJECT" as const, label: "Reject", key: "X", icon: XCircle },
            ].map(({ result, label, key, icon: Icon }) => (
              <button
                key={result}
                type="button"
                data-no-global-loading
                disabled={busy}
                onClick={() => decide(result)}
                aria-keyshortcuts={key}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60",
                  result === "PASS" ? "bg-brand-ink text-brand" : "border border-brand-ink/50 text-brand-ink"
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                {label}
                <kbd data-i18n-ignore className="hidden rounded bg-brand-ink/15 px-1.5 text-micro sm:inline">{key}</kbd>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-tile bg-inset/60 px-3 py-2 text-sm text-ink-soft">This tray has already been reviewed, so there is nothing to decide.</p>
      )}

      <PhotoLightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onIndexChange={setLightbox} />
    </div>
  );
}
