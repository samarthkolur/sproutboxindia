"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FeedbackForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");

  async function submit() {
    await fetch("/api/restaurant/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, notes }),
    });
  }

  return (
    <div className="glass p-5">
      <h3 className="font-bold text-text-primary">Delivery feedback</h3>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} type="button" className={`text-2xl ${item <= rating ? "text-amber-500" : "text-sprout-100"}`} onClick={() => setRating(item)}>
            ★
          </button>
        ))}
      </div>
      <textarea className="mt-4 min-h-28 w-full rounded-xl border border-sprout-800/20 bg-white/70 p-3 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <Button className="mt-4 bg-sprout-800 text-white hover:bg-sprout-900" onClick={submit}>Submit feedback</Button>
    </div>
  );
}
