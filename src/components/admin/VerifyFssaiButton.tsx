"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verifyGrowerFssai } from "@/actions/grower.actions";
import { Modal } from "@/components/ui/modal";

// Marking a number verified is a statement to restaurants, so it asks first, and shows the
// number being confirmed.
export function VerifyFssaiButton({ growerId, growerName, fssaiRegNumber, size = "md" }: { growerId: string; growerName: string; fssaiRegNumber: string; size?: "sm" | "md" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const res = await verifyGrowerFssai(growerId);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("FSSAI verified", { description: `${growerName} is now marked as verified.` });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        data-no-global-loading
        onClick={() => setOpen(true)}
        aria-label={`Verify FSSAI for ${growerName}`}
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand font-medium text-brand-ink transition-opacity hover:opacity-90 ${size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm"}`}
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Verify
      </button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        dismissible={!busy}
        size="sm"
        title="Verify FSSAI registration"
        description={growerName}
        footer={
          <>
            <button type="button" data-no-global-loading onClick={() => setOpen(false)} disabled={busy} className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-60">
              Cancel
            </button>
            <button type="button" data-no-global-loading onClick={confirm} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-ink hover:opacity-90 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              Mark verified
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Confirm you have checked this registration number against the FSSAI register.</p>
        <p className="mt-3 rounded-tile bg-inset/60 px-3 py-2 text-center font-medium tabular-nums text-ink" data-i18n-ignore>
          {fssaiRegNumber}
        </p>
      </Modal>
    </>
  );
}
