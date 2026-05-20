"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CROP_TYPES } from "@/lib/constants";

export function OrderBuilder() {
  const router = useRouter();
  const [cropType, setCropType] = useState<(typeof CROP_TYPES)[number]>("sunflower");
  const [quantityKg, setQuantityKg] = useState(1);

  async function submit() {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 10);
    const response = await fetch("/api/restaurant/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropType, quantityKg, deliveryDate }),
    });
    if (response.ok) router.push("/restaurant/orders");
  }

  return (
    <div className="glass p-5">
      <h3 className="font-bold text-text-primary">Build order</h3>
      <label className="mt-4 block text-sm font-semibold text-text-primary">
        Crop
        <select className="mt-2 h-11 w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3" value={cropType} onChange={(event) => setCropType(event.target.value as typeof cropType)}>
          {CROP_TYPES.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold text-text-primary">
        Quantity kg
        <input className="mt-2 h-11 w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3" type="number" min="0.5" step="0.5" value={quantityKg} onChange={(event) => setQuantityKg(Number(event.target.value))} />
      </label>
      <Button className="mt-5 w-full bg-sprout-800 text-white hover:bg-sprout-900" onClick={submit}>Place order</Button>
    </div>
  );
}
