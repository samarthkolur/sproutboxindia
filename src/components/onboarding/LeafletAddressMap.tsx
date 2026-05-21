"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import type { SelectedAddress } from "./AddressMapPicker";

const defaultCenter: [number, number] = [12.9716, 77.5946];

type NominatimResponse = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
  };
};

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [map, position]);

  return null;
}

function buildAddress(result: NominatimResponse, lat: number, lng: number): SelectedAddress {
  const address = result.address ?? {};

  return {
    address: result.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    city:
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.state_district ||
      address.county ||
      address.state ||
      "",
    pincode: address.postcode || "",
    lat,
    lng,
  };
}

export default function LeafletAddressMap({
  value,
  onChange,
}: {
  value: SelectedAddress | null;
  onChange: (address: SelectedAddress) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="height:34px;width:34px;border-radius:9999px;background:#2D6A4F;color:white;display:grid;place-items:center;box-shadow:0 10px 24px rgba(45,106,79,.35);border:3px solid white;font-size:18px;">⌖</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    []
  );
  const position: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  async function pickLocation(lat: number, lng: number) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lng),
        addressdetails: "1",
        zoom: "18",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);

      if (!response.ok) {
        throw new Error("Could not fetch address for this location.");
      }

      const result = (await response.json()) as NominatimResponse;
      onChange(buildAddress(result, lat, lng));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch address.");
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Current location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        void pickLocation(location.coords.latitude, location.coords.longitude);
      },
      () => setError("Allow location access or click the map to choose manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={position}
        zoom={value ? 15 : 12}
        scrollWheelZoom
        className="h-64 w-full sm:h-56"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onPick={pickLocation} />
        <Recenter position={position} />
        {value ? <Marker position={position} icon={markerIcon} /> : null}
      </MapContainer>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={loading}
        className="absolute right-3 top-3 z-[500] inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-sprout-800 shadow-lg shadow-sprout-900/10 transition-colors hover:bg-sprout-50 disabled:opacity-60"
      >
        <LocateFixed className="h-4 w-4" />
        {loading ? "Fetching..." : "Use current"}
      </button>

      <div className="absolute bottom-3 left-3 right-3 z-[500] rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-text-secondary shadow-lg shadow-sprout-900/10 sm:text-xs">
        {error || "Click anywhere on the map to auto-fill address and PIN code."}
      </div>
    </div>
  );
}
