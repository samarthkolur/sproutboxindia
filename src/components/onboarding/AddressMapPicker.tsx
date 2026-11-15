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
    <div className="grid h-56 place-items-center rounded-tile border border-hairline bg-inset/60 text-sm font-medium text-ink-muted">
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
      <div className="overflow-hidden rounded-tile border border-hairline bg-panel/50 shadow-panel">
        <LeafletAddressMap value={value} onChange={onChange} />
      </div>

      <div className="rounded-tile border border-hairline bg-panel/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
          <MapPin className="h-4 w-4" />
          Selected address
        </div>
        {value ? (
          <div className="space-y-2 text-sm">
            <p className="leading-relaxed text-ink">{value.address}</p>
            <div className="grid gap-2 min-[420px]:grid-cols-2">
              <div className="rounded-xl bg-inset/70 px-3 py-2">
                <p className="text-micro text-ink-muted">
                  City
                </p>
                <p className="font-medium text-ink">{value.city || "Not found"}</p>
              </div>
              <div className="rounded-xl bg-inset/70 px-3 py-2">
                <p className="text-micro text-ink-muted">
                  PIN code
                </p>
                <p className="font-medium text-ink">{value.pincode || "Not found"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Click the map or use current location to fetch the full address and PIN code.
          </p>
        )}
      </div>
    </div>
  );
}
