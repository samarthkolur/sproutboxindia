"use client";

import { useState } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { processQCCheckIn } from "@/actions/qc.actions";
import type { QCResult } from "@prisma/client";

type CheckInItem = {
  id: string;
  day: number;
  imageTopUrl: string | null;
  imageSideUrl: string | null;
  notes: string | null;
};

type QCBatchItem = {
  id: string;
  trayNumber: number;
  currentDay: number;
  createdAt: Date;
  task: {
    cropType: string;
    grower: {
      user: {
        name: string | null;
      };
    };
  };
  checkIns: CheckInItem[];
};

export function QCClient({ initialQueue }: { initialQueue: QCBatchItem[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // QC is submitted via the latest check-in's ID
  const handleQC = async (batch: QCBatchItem, result: QCResult) => {
    const latestCheckIn = batch.checkIns[0];
    if (!latestCheckIn) {
      setError("No check-in found for this batch");
      return;
    }
    setProcessingId(batch.id);
    setError(null);

    const res = await processQCCheckIn(latestCheckIn.id, result);

    if (res?.error) {
      setError(res.error);
      setProcessingId(null);
    } else {
      if (result !== "RISK") {
        // Remove from queue on PASS or REJECT
        setQueue((prev) => prev.filter((item) => item.id !== batch.id));
      }
      setProcessingId(null);
    }
  };

  if (queue.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-sprout-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            QC queue clear
          </h3>
          <p className="text-sm text-text-muted">
            No batches pending quality review
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="QC image zoom"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}

      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {queue.map((batch) => {
          const latestCheckIn = batch.checkIns[0];
          return (
            <GlassCard key={batch.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {batch.task.grower.user.name || "Unknown Grower"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {batch.task.cropType} · Tray #{batch.trayNumber} · Day{" "}
                    {batch.currentDay}
                  </p>
                </div>
                <p className="text-xs text-text-muted">
                  {new Date(batch.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Images */}
              {latestCheckIn && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {latestCheckIn.imageTopUrl ? (
                    <button
                      onClick={() => setLightboxSrc(latestCheckIn.imageTopUrl!)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-white/40 bg-gray-100 hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={latestCheckIn.imageTopUrl}
                        alt="Top view"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded-md">
                        Top View
                      </span>
                    </button>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                      <span className="text-[10px] text-gray-400">No top view</span>
                    </div>
                  )}
                  {latestCheckIn.imageSideUrl ? (
                    <button
                      onClick={() => setLightboxSrc(latestCheckIn.imageSideUrl!)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-white/40 bg-gray-100 hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={latestCheckIn.imageSideUrl}
                        alt="Side view"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded-md">
                        Side View
                      </span>
                    </button>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                      <span className="text-[10px] text-gray-400">No side view</span>
                    </div>
                  )}
                </div>
              )}

              {latestCheckIn?.notes && (
                <p className="text-sm text-text-secondary mb-4 bg-white/50 rounded-xl p-3 border border-white/40">
                  &ldquo;{latestCheckIn.notes}&rdquo;
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  disabled={processingId === batch.id}
                  onClick={() => handleQC(batch, "PASS")}
                  className="w-full sm:flex-1 bg-sprout-800 text-white py-2 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === batch.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Pass
                </button>
                <button
                  disabled={processingId === batch.id}
                  onClick={() => handleQC(batch, "RISK")}
                  className="w-full sm:flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === batch.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Risk
                </button>
                <button
                  disabled={processingId === batch.id}
                  onClick={() => handleQC(batch, "REJECT")}
                  className="w-full sm:flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === batch.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Reject
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
