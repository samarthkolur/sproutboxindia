"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

export type SelectedAddress = {
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
};

const LeafletAddressMap = dynamic(() => import("./LeafletAddressMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-56 place-items-center rounded-2xl border border-white/50 bg-white/50 text-sm font-semibold text-text-muted">
      Loading map...
    </div>
  ),
});

export function AddressMapPicker({
  value,
  onChange,
}: {
  value: SelectedAddress | null;
  onChange: (address: SelectedAddress) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-sm">
        <LeafletAddressMap value={value} onChange={onChange} />
      </div>

      <div className="rounded-2xl border border-white/50 bg-white/55 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sprout-800">
          <MapPin className="h-4 w-4" />
          Selected address
        </div>
        {value ? (
          <div className="space-y-2 text-sm">
            <p className="leading-relaxed text-text-primary">{value.address}</p>
            <div className="grid gap-2 min-[420px]:grid-cols-2">
              <div className="rounded-xl bg-white/50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  City
                </p>
                <p className="font-semibold text-text-primary">{value.city || "Not found"}</p>
              </div>
              <div className="rounded-xl bg-white/50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  PIN code
                </p>
                <p className="font-semibold text-text-primary">{value.pincode || "Not found"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Click the map or use current location to fetch the full address and PIN code.
          </p>
        )}
      </div>
    </div>
  );
}
