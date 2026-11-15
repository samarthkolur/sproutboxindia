"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setGrowerActive } from "@/actions/grower.actions";
import { ToggleRow } from "@/components/ui/toggle-row";

export function GrowerStatusToggle({ growerId, active }: { growerId: string; active: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(active);
  const [busy, setBusy] = useState(false);

  async function change(next: boolean) {
    setBusy(true);
    setValue(next);
    const res = await setGrowerActive(growerId, next);
    setBusy(false);
    if (res && "error" in res && res.error) {
      setValue(!next);
      toast.error(res.error);
      return;
    }
    toast.success(next ? "Grower is active again" : "Grower paused", { description: next ? "They can be given trays again." : "They will be skipped when allocating." });
    router.refresh();
  }

  return (
    <ToggleRow
      title="Active"
      description={value ? "Can be given trays." : "Paused: skipped when allocating trays."}
      checked={value}
      onChange={change}
      disabled={busy}
    />
  );
}
