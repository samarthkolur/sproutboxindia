import { FeedbackForm } from "@/components/restaurant/FeedbackForm";

export function QCReviewPanel({ batchId, checkInId }: { batchId: string; checkInId: string }) {
  return (
    <div className="glass p-5">
      <h3 className="font-bold text-text-primary">QC batch {batchId.slice(0, 8).toUpperCase()}</h3>
      <form action="/api/admin/qc" method="post" className="mt-4 grid gap-3">
        <input type="hidden" name="batchId" value={batchId} />
        <input type="hidden" name="checkInId" value={checkInId} />
        <p className="text-sm text-text-muted">Use the API panel or route handler for PASS, RISK, and REJECT decisions.</p>
      </form>
      <div className="hidden"><FeedbackForm orderId={batchId} /></div>
    </div>
  );
}
