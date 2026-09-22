"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { trackSignUp } from "@/lib/gtag";

const steps = ["Personal", "Location", "Space", "Kit", "Compliance", "Review"];

const fieldLabels: Record<string, string> = {
  areaSize: "Area Size",
  fssaiRegNumber: "FSSAI Registration Number",
};

export function GrowerOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    areaSize: "25",
    kit: "Starter",
    fssaiRegNumber: "",
  });

  async function submit() {
    const response = await fetch("/api/grower/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      trackSignUp("grower", { city: form.city, kit: form.kit });
      router.push("/login");
    }
  }

  return (
    <GlassCard className="mx-auto max-w-2xl">
      <StepProgress steps={steps} currentStep={step} />
      <div className="mt-6 grid gap-4">
        {Object.entries(form)
          .filter(([key]) => {
            if (step === 0) return ["name", "email", "password", "phone"].includes(key);
            if (step === 1) return ["address", "city", "pincode"].includes(key);
            if (step === 2) return ["areaSize"].includes(key);
            if (step === 3) return ["kit"].includes(key);
            if (step === 4) return ["fssaiRegNumber"].includes(key);
            return true;
          })
          .map(([key, value]) => (
            <label key={key} className="text-sm font-semibold capitalize text-text-primary">
              {fieldLabels[key] || key}
              <input
                className="mt-2 h-11 w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3 text-sm outline-none focus:border-sprout-600"
                type={key === "password" ? "password" : "text"}
                value={value}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
        {step === 4 && (
          <p className="text-xs text-text-muted">
            Required by Indian food safety law (FSSAI) before you can supply restaurants
            commercially. You can leave this blank for now and add it later from your profile —
            your account stays inactive for live orders until it&apos;s on file and verified.
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((item) => item - 1)}>
          Back
        </Button>
        <Button
          type="button"
          className="bg-sprout-800 text-white hover:bg-sprout-900"
          onClick={() => (step === steps.length - 1 ? submit() : setStep((item) => item + 1))}
        >
          {step === steps.length - 1 ? "Submit" : "Continue"}
        </Button>
      </div>
    </GlassCard>
  );
}
