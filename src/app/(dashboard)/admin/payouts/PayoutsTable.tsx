"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markPayoutsAsPaid } from "@/actions/payout.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { StatusChip } from "@/components/ui/status-chip";
import { cropName, rupees } from "@/lib/admin";

export interface PayoutRow {
  id: string;
  growerId: string;
  growerName: string;
  cropType: string;
  trayNumber: number;
  createdAt: string;
  status: string;
  amount: number;
}

// Payouts with tick boxes on the unpaid ones. "Mark paid" asks first, naming the count and the
// total, because it is a statement that real money has gone out.
export function PayoutsTable({ rows, selectable }: { rows: PayoutRow[]; selectable: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const picked = rows.filter((r) => selected.has(r.id));
  const total = picked.reduce((sum, r) => sum + r.amount, 0);

  const columns: Column<PayoutRow>[] = [
    {
      key: "grower",
      header: "Grower",
      mobile: "title",
      cell: (r) => (
        <>
          <span data-i18n-ignore>{r.growerName}</span>
          <span className="block text-micro font-normal text-ink-muted">{`${cropName(r.cropType)} · Tray ${r.trayNumber}`}</span>
        </>
      ),
    },
    { key: "date", header: "Date", cell: (r) => <time dateTime={r.createdAt}>{format(new Date(r.createdAt), "d MMM yyyy")}</time> },
    { key: "status", header: "Status", cell: (r) => <StatusChip status={r.status} /> },
    { key: "amount", header: "Amount", align: "right", cell: (r) => <span className="font-medium text-ink">{rupees(r.amount)}</span> },
  ];

  async function pay() {
    setBusy(true);
    try {
      const result = await markPayoutsAsPaid(picked.map((r) => r.id));
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.count === 1 ? "1 payout marked paid" : `${result.count} payouts marked paid`);
      setSelected(new Set());
      setConfirming(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selectable && picked.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-brand p-3 text-brand-ink">
          <p className="pl-2 text-sm">{`${picked.length} selected · ${rupees(total)}`}</p>
          <button type="button" data-no-global-loading onClick={() => setConfirming(true)} className="rounded-full bg-brand-ink px-4 py-2 text-sm font-medium text-brand transition-opacity hover:opacity-90">
            {`Mark paid (${picked.length})`}
          </button>
        </div>
      ) : null}

      <DataTable
        caption="Payouts"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        rowLabel={(r) => `${r.growerName}, ${rupees(r.amount)}`}
        selection={
          selectable
            ? {
                selected,
                onToggle: (id) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (!next.delete(id)) next.add(id);
                    return next;
                  }),
                onToggleAll: () => setSelected((current) => (current.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)))),
              }
            : undefined
        }
        empty={<EmptyState icon={CreditCard} title="No payouts here" description="Payouts appear when growers harvest trays that passed quality control." />}
      />

      <Modal
        open={confirming}
        onClose={() => !busy && setConfirming(false)}
        dismissible={!busy}
        size="sm"
        title="Mark payouts as paid"
        footer={
          <>
            <button type="button" data-no-global-loading onClick={() => setConfirming(false)} disabled={busy} className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-60">
              Cancel
            </button>
            <button type="button" data-no-global-loading onClick={pay} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-ink hover:opacity-90 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              {`Mark ${picked.length} as paid`}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{`This marks ${picked.length} ${picked.length === 1 ? "payout" : "payouts"} totalling ${rupees(total)} as paid. Do it once the money has been sent.`}</p>
      </Modal>
    </>
  );
}
