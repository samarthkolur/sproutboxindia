"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/shared/ImageUploader";

export function CheckinModal({ batchId, day }: { batchId: string; day: number }) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState("");
  const [side, setSide] = useState("");

  async function submit() {
    await fetch("/api/grower/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, day, imageTopUrl: top || undefined, imageSideUrl: side || undefined }),
    });
    setOpen(false);
  }

  return (
    <>
      <Button type="button" className="bg-sprout-800 text-white hover:bg-sprout-900" onClick={() => setOpen(true)}>
        Complete Today
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary">Day {day} check-in</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ImageUploader label="Top view" onChange={setTop} />
              <ImageUploader label="Side view" onChange={setSide} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" className="bg-sprout-800 text-white hover:bg-sprout-900" onClick={submit}>Submit</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
