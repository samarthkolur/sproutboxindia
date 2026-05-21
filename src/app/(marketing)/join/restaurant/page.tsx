"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AddressMapPicker, type SelectedAddress } from "@/components/onboarding/AddressMapPicker";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { CROP_TYPES, CROP_DISPLAY_NAMES, CROP_PRICE_PER_KG, CROP_CYCLE_DAYS, type CropType } from "@/lib/constants";

const steps = ["Business", "Crops", "Schedule", "Review"];

function RestaurantOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);

  const [data, setData] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    password: searchParams.get("password") || "",
    businessName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    gstNumber: "",
    selectedCrops: [] as CropType[],
    deliveryFrequency: "weekly" as "weekly" | "biweekly",
    preferredDay: "monday" as string,
  });

  const update = (field: string, value: string | string[]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const updateAddress = (address: SelectedAddress) => {
    setSelectedAddress(address);
    setData((prev) => ({
      ...prev,
      address: address.address,
      city: address.city,
      pincode: address.pincode,
    }));
  };

  const toggleCrop = (crop: CropType) => {
    setData((prev) => ({
      ...prev,
      selectedCrops: prev.selectedCrops.includes(crop)
        ? prev.selectedCrops.filter((c) => c !== crop)
        : [...prev.selectedCrops, crop],
    }));
  };

  const validateStep = () => {
    if (step === 0 && (!data.address || !data.city || !data.pincode)) {
      setError("Choose a location on the map so address, city, and PIN code can be fetched.");
      return false;
    }

    setError("");
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/restaurant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");
      router.push("/login?registered=true");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm";
  const labelClass =
    "block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider";

  const cropEmojis: Record<CropType, string> = {
    sunflower: "🌻",
    "pea-shoots": "🫛",
    radish: "🌶️",
    wheatgrass: "🌾",
    mustard: "🌿",
    fenugreek: "🍃",
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-grid bg-grid-fade" />
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="blob blob-animated w-[500px] h-[500px] bg-sprout-300/40 -top-40 right-0" />
      <div className="blob blob-animated-alt w-[400px] h-[400px] bg-sprout-200/50 bottom-0 -left-20" />

      <div className="glass-strong p-8 sm:p-10 w-full max-w-lg mx-4 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[24px]" />
        <div className="relative z-10">
          {/* Logo */}
          <BrandLogo className="mb-6" />

          <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1">
            Partner as Restaurant 🍽️
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            Set up your restaurant profile and preferences
          </p>

          <StepProgress steps={steps} currentStep={step} />

          {error && (
            <div className="bg-status-error/10 border border-status-error/20 text-status-error rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Business */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Restaurant Name</label>
                <input className={inputClass} value={data.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Your restaurant name" required />
              </div>
              <div>
                <label className={labelClass}>Contact Name</label>
                <input className={inputClass} value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Primary contact person" required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="restaurant@example.com" required />
              </div>
              {!searchParams.get("password") && (
                <div>
                  <label className={labelClass}>Password</label>
                  <input className={inputClass} type="password" value={data.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 6 characters" required />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input className={inputClass} type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765" />
                </div>
                <div>
                  <label className={labelClass}>GST (optional)</label>
                  <input className={inputClass} value={data.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} placeholder="22AAAA..." />
                </div>
              </div>
              <AddressMapPicker value={selectedAddress} onChange={updateAddress} />
            </div>
          )}

          {/* Step 1: Crops */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary mb-2">
                Select the microgreens you&apos;d like to order regularly:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CROP_TYPES.map((crop) => {
                  const isSelected = data.selectedCrops.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className={`p-4 rounded-xl border text-left transition-all group ${
                        isSelected
                          ? "border-sprout-600 bg-sprout-50/80 shadow-md"
                          : "border-white/50 bg-white/40 hover:bg-white/60"
                      }`}
                    >
                      <span className="text-xl mb-1 block">{cropEmojis[crop]}</span>
                      <p className="text-sm font-semibold text-text-primary">{CROP_DISPLAY_NAMES[crop]}</p>
                      <p className="text-[11px] text-text-muted">₹{CROP_PRICE_PER_KG[crop]}/kg • {CROP_CYCLE_DAYS[crop]} days</p>
                    </button>
                  );
                })}
              </div>
              {data.selectedCrops.length > 0 && (
                <p className="text-xs text-sprout-600 font-semibold">
                  {data.selectedCrops.length} varieties selected
                </p>
              )}
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Delivery Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["weekly", "biweekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => update("deliveryFrequency", freq)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        data.deliveryFrequency === freq
                          ? "border-sprout-600 bg-sprout-50/80 text-sprout-800 shadow-md"
                          : "border-white/50 bg-white/40 text-text-secondary hover:bg-white/60"
                      }`}
                    >
                      <p className="text-sm font-bold capitalize">{freq}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {freq === "weekly" ? "Every week" : "Every 2 weeks"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Preferred Delivery Day</label>
                <select className={inputClass} value={data.preferredDay} onChange={(e) => update("preferredDay", e.target.value)}>
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => (
                    <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              {[
                { label: "Restaurant", value: data.businessName || "—" },
                { label: "Contact", value: data.name },
                { label: "Email", value: data.email },
                { label: "Phone", value: data.phone || "—" },
                { label: "City", value: data.city || "—" },
                { label: "PIN", value: data.pincode || "—" },
                { label: "Address", value: data.address || "—" },
                { label: "Crops", value: data.selectedCrops.map((c) => CROP_DISPLAY_NAMES[c]).join(", ") || "None selected" },
                { label: "Frequency", value: data.deliveryFrequency },
                { label: "Day", value: data.preferredDay },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-white/50 rounded-xl p-3 border border-white/40">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{item.label}</span>
                  <span className="text-sm font-medium text-text-primary capitalize text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={back} className="text-sm font-semibold text-text-secondary hover:text-sprout-800 transition-colors">
                ← Back
              </button>
            ) : (
              <Link href="/register" className="text-sm font-semibold text-text-secondary hover:text-sprout-800 transition-colors">
                ← Register
              </Link>
            )}

            {step < steps.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 bg-sprout-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all active:scale-[0.98]"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-sprout-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Submit Application"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>}>
      <RestaurantOnboardingForm />
    </Suspense>
  );
}
