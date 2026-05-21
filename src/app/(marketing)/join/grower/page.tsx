"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AddressMapPicker, type SelectedAddress } from "@/components/onboarding/AddressMapPicker";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { KIT_OPTIONS } from "@/lib/constants";
import { clearRegistrationPrefill, readRegistrationPrefill } from "@/lib/registration-prefill";

const steps = ["Personal", "Location", "Space", "Kit", "Review"];

function GrowerOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [hasPrefilledPassword, setHasPrefilledPassword] = useState(false);

  const [data, setData] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    password: "",
    phone: "",
    city: "",
    address: "",
    pincode: "",
    spaceType: "terrace" as "terrace" | "balcony" | "room" | "backyard",
    areaSize: "",
    lightAccess: "natural" as "natural" | "artificial" | "both",
    kit: "Starter" as "Starter" | "Standard" | "Pro",
    bankAccount: "",
    ifsc: "",
    upiId: "",
  });

  const update = (field: string, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const prefill = readRegistrationPrefill("GROWER");
    if (!prefill) return;

    setData((prev) => ({
      ...prev,
      name: prefill.name,
      email: prefill.email,
      password: prefill.password,
    }));
    setHasPrefilledPassword(Boolean(prefill.password));
  }, []);

  const updateAddress = (address: SelectedAddress) => {
    setSelectedAddress(address);
    setData((prev) => ({
      ...prev,
      address: address.address,
      city: address.city,
      pincode: address.pincode,
    }));
  };

  const validateStep = () => {
    if (step === 1 && (!data.address || !data.city || !data.pincode)) {
      setError("Choose a location on the map so address, city, and PIN code can be fetched.");
      return false;
    }

    if (step === 2 && (!data.areaSize || Number(data.areaSize) <= 0)) {
      setError("Enter a valid growing area greater than 0 sq ft.");
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
    if (!data.areaSize || Number(data.areaSize) <= 0) {
      setError("Enter a valid growing area greater than 0 sq ft.");
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        ...data,
        areaSize: Number(data.areaSize),
      };
      const res = await fetch("/api/grower/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");
      clearRegistrationPrefill();
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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-grid bg-grid-fade" />
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="blob blob-animated w-[500px] h-[500px] bg-sprout-200/60 -top-40 -left-20" />
      <div className="blob blob-animated-alt w-[400px] h-[400px] bg-sprout-300/40 bottom-0 right-0" />

      <div className="glass-strong p-8 sm:p-10 w-full max-w-lg mx-4 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[24px]" />
        <div className="relative z-10">
          {/* Logo */}
          <BrandLogo className="mb-6" />

          <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1">
            Join as Grower 🌱
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            Set up your growing profile in a few steps
          </p>

          <StepProgress steps={steps} currentStep={step} />

          {error && (
            <div className="bg-status-error/10 border border-status-error/20 text-status-error rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" required />
              </div>
              {!hasPrefilledPassword && (
                <div>
                  <label className={labelClass}>Password</label>
                  <input className={inputClass} type="password" value={data.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 6 characters" required />
                </div>
              )}
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 9876543210" />
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <AddressMapPicker value={selectedAddress} onChange={updateAddress} />
            </div>
          )}

          {/* Step 2: Space */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Space Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["terrace", "balcony", "room", "backyard"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update("spaceType", type)}
                      className={`p-3 rounded-xl border text-center transition-all text-sm font-medium capitalize ${
                        data.spaceType === type
                          ? "border-sprout-600 bg-sprout-50/80 text-sprout-800 shadow-md"
                          : "border-white/50 bg-white/40 text-text-secondary hover:bg-white/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Area (sq ft)</label>
                <input className={inputClass} type="number" value={data.areaSize} onChange={(e) => update("areaSize", e.target.value)} placeholder="e.g. 100" />
              </div>
              <div>
                <label className={labelClass}>Light Access</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["natural", "artificial", "both"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update("lightAccess", type)}
                      className={`p-3 rounded-xl border text-center transition-all text-sm font-medium capitalize ${
                        data.lightAccess === type
                          ? "border-sprout-600 bg-sprout-50/80 text-sprout-800 shadow-md"
                          : "border-white/50 bg-white/40 text-text-secondary hover:bg-white/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Kit */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Choose Your Kit</label>
                <div className="space-y-3">
                  {KIT_OPTIONS.map((kit) => (
                    <button
                      key={kit.name}
                      type="button"
                      onClick={() => update("kit", kit.name)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        data.kit === kit.name
                          ? "border-sprout-600 bg-sprout-50/80 shadow-md"
                          : "border-white/50 bg-white/40 hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{kit.name}</p>
                          <p className="text-xs text-text-muted">{kit.description} — {kit.trays} trays</p>
                        </div>
                        <span className="text-sm font-bold text-sprout-800">
                          {kit.price === 0 ? "Free" : `₹${kit.price}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>UPI ID (for payouts)</label>
                <input className={inputClass} value={data.upiId} onChange={(e) => update("upiId", e.target.value)} placeholder="name@upi" />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-3">
              {[
                { label: "Name", value: data.name },
                { label: "Email", value: data.email },
                { label: "Phone", value: data.phone || "—" },
                { label: "City", value: data.city || "—" },
                { label: "PIN", value: data.pincode || "—" },
                { label: "Address", value: data.address || "—" },
                { label: "Space", value: `${data.spaceType}, ${data.areaSize || "—"} sq ft` },
                { label: "Light", value: data.lightAccess },
                { label: "Kit", value: data.kit },
                { label: "UPI", value: data.upiId || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-white/50 rounded-xl p-3 border border-white/40">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{item.label}</span>
                  <span className="text-sm font-medium text-text-primary capitalize">{item.value}</span>
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

export default function GrowerOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>}>
      <GrowerOnboardingForm />
    </Suspense>
  );
}
