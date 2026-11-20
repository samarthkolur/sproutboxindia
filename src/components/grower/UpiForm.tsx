"use client";

import { useState, useTransition } from "react";
import { updateGrowerUpi } from "@/actions/grower.actions";

/** Shown on the grower profile when no UPI ID is on file, so payouts can be set up after sign-up. */
export function UpiForm() {
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateGrowerUpi(upiId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="name@upi"
          aria-label="UPI ID"
          className="w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-sprout-600"
        />
        {error && <p className="mt-1 text-xs text-status-error">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending || !upiId.trim()}
        className="rounded-xl bg-sprout-800 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-sprout-900 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add UPI for payouts"}
      </button>
    </form>
  );
}
