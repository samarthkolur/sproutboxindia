"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { processQCCheckIn } from "@/actions/qc.actions";
import { QCReview, type ReviewItem } from "@/components/admin/QCReview";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailLayout } from "@/components/ui/detail-layout";
import { controlClass } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { cropName, decisionForKey, nextIndex, waitingFor, type QcDecision } from "@/lib/admin";
import { cn } from "@/lib/utils";

export interface QueueItem extends ReviewItem {
  day: number;
  /** ISO string. */
  waitingSince: string;
}

// Master-detail QC: the queue on the left, the review panel on the right. P, R and X decide,
// J and K move through the queue, and after a pass or reject the next tray opens by itself.
export function QCClient({ queue: initial }: { queue: QueueItem[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState(initial);
  const [crop, setCrop] = useState("all");
  const [grower, setGrower] = useState("all");
  const [openId, setOpenId] = useState<string | null>(initial[0]?.batchId ?? null);
  const [busy, setBusy] = useState(false);

  const crops = useMemo(() => Array.from(new Set(queue.map((q) => q.cropType))), [queue]);
  const growers = useMemo(() => Array.from(new Set(queue.map((q) => q.growerName))).sort(), [queue]);
  const shown = queue.filter((q) => (crop === "all" || q.cropType === crop) && (grower === "all" || q.growerName === grower));
  const open = shown.find((q) => q.batchId === openId) ?? shown[0] ?? null;

  async function decide(result: QcDecision, notes: string, checkInId: string) {
    if (!open) return false;
    setBusy(true);
    try {
      const res = await processQCCheckIn(checkInId, result, notes || undefined);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return false;
      }
      if (result === "RISK") {
        // Stays in the queue, now carrying its flag, so it is not forgotten.
        setQueue((current) => current.map((q) => (q.batchId === open.batchId ? { ...q, checkIns: q.checkIns.map((c) => (c.id === checkInId ? { ...c, qcResult: "RISK", qcNotes: notes || null } : c)) } : q)));
        toast.success("Flagged as a risk", { description: "It stays in the queue for another look." });
      } else {
        const at = shown.findIndex((q) => q.batchId === open.batchId);
        const rest = shown.filter((q) => q.batchId !== open.batchId);
        setQueue((current) => current.filter((q) => q.batchId !== open.batchId));
        setOpenId(rest.length > 0 ? rest[Math.min(at, rest.length - 1)].batchId : null);
        toast.success(result === "PASS" ? "Tray passed" : "Tray rejected", { description: result === "REJECT" ? "The grower has been sent your reason." : undefined });
        router.refresh();
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  // Keyboard: the shortcuts live on the review's own buttons, so the handler just clicks them.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const result = decisionForKey(event.key);
      if (result) {
        panelRef.current?.querySelector<HTMLButtonElement>(`[aria-keyshortcuts="${result === "PASS" ? "P" : result === "RISK" ? "R" : "X"}"]`)?.click();
        event.preventDefault();
      } else if (event.key === "j" || event.key === "k") {
        const at = shown.findIndex((q) => q.batchId === open?.batchId);
        const next = nextIndex(at, shown.length, event.key === "j" ? 1 : -1);
        if (next >= 0) setOpenId(shown[next].batchId);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown, open]);

  if (queue.length === 0) {
    return <EmptyState icon={CheckCircle2} title="The QC queue is clear" description="No trays are waiting for review." />;
  }

  return (
    <DetailLayout
      asidePosition="left"
      compact
      aside={
        <Panel padding="none" className="overflow-hidden lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2 border-b border-hairline/70 p-3">
            <select aria-label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)} className={cn(controlClass, "!w-auto flex-1 !py-2 text-sm")}>
              <option value="all">All crops</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {cropName(c)}
                </option>
              ))}
            </select>
            <select aria-label="Grower" value={grower} onChange={(e) => setGrower(e.target.value)} className={cn(controlClass, "!w-auto flex-1 !py-2 text-sm")}>
              <option value="all">All growers</option>
              {growers.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <p className="px-4 py-2 text-micro text-ink-muted">{`${shown.length} ${shown.length === 1 ? "tray" : "trays"} waiting`}</p>
          <ul className="max-h-[60vh] divide-y divide-hairline/70 overflow-y-auto">
            {shown.map((q) => {
              const active = open?.batchId === q.batchId;
              const flagged = q.checkIns[0]?.qcResult === "RISK";
              return (
                <li key={q.batchId}>
                  <button
                    type="button"
                    data-no-global-loading
                    aria-pressed={active}
                    onClick={() => setOpenId(q.batchId)}
                    className={cn("block w-full px-4 py-3 text-left transition-colors hover:bg-inset/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50", active && "bg-leaf-soft/60")}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{q.growerName}</span>
                      <span className="text-micro text-ink-muted">{waitingFor(new Date(q.waitingSince))}</span>
                    </span>
                    <span className="block text-micro text-ink-muted">{`${cropName(q.cropType)} · Tray ${q.trayNumber} · Day ${q.day}`}</span>
                    {flagged ? <span className="mt-1 inline-block rounded-full bg-watch-soft px-2 py-0.5 text-micro font-medium text-watch">Risk flagged</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      }
    >
      <Panel>
        {open ? (
          <div ref={panelRef}>
            <QCReview key={open.batchId} item={open} onDecide={decide} busy={busy} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-micro text-ink-muted">
              <span>Shortcuts: P pass, R risk, X reject, J and K move through the queue.</span>
              <Link href={`/admin/qc/${open.batchId}`} className="inline-flex items-center gap-1 font-medium text-ink-soft hover:text-ink">
                Open this tray
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No trays match these filters.</p>
        )}
      </Panel>
    </DetailLayout>
  );
}
