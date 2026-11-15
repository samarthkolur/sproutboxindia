"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/status-chip";
import { PhotoLightbox, type LightboxImage } from "@/components/ui/photo-lightbox";

export interface CheckInEntry {
  id: string;
  day: number;
  trayNumber: number;
  /** ISO string: this crosses the server/client boundary. */
  createdAt: string;
  imageTopUrl: string | null;
  imageSideUrl: string | null;
  notes: string | null;
  qcResult: string | null;
  qcNotes: string | null;
}

// Every check-in a grower has sent for this task, newest first, with the QC verdict and
// the reviewer's reason beside it, and the photos opening in a lightbox with a close button.
export function CheckInHistory({ entries }: { entries: CheckInEntry[] }) {
  const images: LightboxImage[] = [];
  const indexOf = new Map<string, number>();
  for (const entry of entries) {
    if (entry.imageTopUrl) {
      indexOf.set(`${entry.id}:top`, images.length);
      images.push({ src: entry.imageTopUrl, alt: `Tray ${entry.trayNumber}, day ${entry.day}, top view` });
    }
    if (entry.imageSideUrl) {
      indexOf.set(`${entry.id}:side`, images.length);
      images.push({ src: entry.imageSideUrl, alt: `Tray ${entry.trayNumber}, day ${entry.day}, side view` });
    }
  }
  const [open, setOpen] = useState<number | null>(null);

  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">No check-ins yet. Your photos will be listed here after your first check-in.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-hairline/70">
        {entries.map((entry) => (
          <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">{`Day ${entry.day}, tray ${entry.trayNumber}`}</p>
              {entry.qcResult ? <StatusChip status={entry.qcResult} /> : <StatusChip status="QC_PENDING" />}
            </div>
            <div className="mt-2 flex gap-2">
              {(["top", "side"] as const).map((view) => {
                const url = view === "top" ? entry.imageTopUrl : entry.imageSideUrl;
                const index = indexOf.get(`${entry.id}:${view}`);
                if (!url || index === undefined) return null;
                return (
                  <button
                    key={view}
                    type="button"
                    data-no-global-loading
                    onClick={() => setOpen(index)}
                    aria-label={images[index].alt}
                    className="group relative h-16 w-16 overflow-hidden rounded-tile bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105 motion-reduce:transition-none" />
                  </button>
                );
              })}
            </div>
            {entry.qcNotes ? (
              <p className="mt-2 rounded-tile bg-inset/60 px-3 py-2 text-sm text-ink-soft">
                <span className="font-medium text-ink">Reviewer note: </span>
                {entry.qcNotes}
              </p>
            ) : null}
            {entry.notes ? <p className="mt-2 text-sm text-ink-soft">{entry.notes}</p> : null}
          </li>
        ))}
      </ul>
      <PhotoLightbox images={images} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
