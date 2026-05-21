"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { processQCCheckIn } from "@/actions/qc.actions";
import type { QCResult } from "@prisma/client";

// Define a type for the queue item that matches the Prisma output
type QCQueueItem = {
  id: string;
  day: number;
  notes: string | null;
  createdAt: Date;
  batch: {
    trayNumber: number;
    task: {
      cropType: string;
      grower: {
        user: {
          name: string | null;
        };
      };
    };
  };
};

export function QCClient({ initialQueue }: { initialQueue: QCQueueItem[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQC = async (id: string, result: QCResult) => {
    setProcessingId(id);
    setError(null);

    const res = await processQCCheckIn(id, result);

    if (res?.error) {
      setError(res.error);
      setProcessingId(null);
    } else {
      // Optimistically remove the item from the queue
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setProcessingId(null);
    }
  };

  if (queue.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            QC queue clear
          </h3>
          <p className="text-sm text-text-muted">
            No check-ins pending quality review
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
      {queue.map((checkin) => (
        <GlassCard key={checkin.id}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {checkin.batch.task.grower.user.name} — Day {checkin.day}
              </p>
              <p className="text-xs text-text-muted">
                {checkin.batch.task.cropType} · Tray #{checkin.batch.trayNumber}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              {new Date(checkin.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          {checkin.notes && (
            <p className="text-sm text-text-secondary mb-4 bg-white/50 rounded-xl p-3 border border-white/40">
              {checkin.notes}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              disabled={processingId === checkin.id}
              onClick={() => handleQC(checkin.id, "PASS")}
              className="flex-1 bg-sprout-800 text-white py-2 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingId === checkin.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Pass
            </button>
            <button
              disabled={processingId === checkin.id}
              onClick={() => handleQC(checkin.id, "RISK")}
              className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingId === checkin.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Risk
            </button>
            <button
              disabled={processingId === checkin.id}
              onClick={() => handleQC(checkin.id, "REJECT")}
              className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingId === checkin.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Reject
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
