"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { trackSignUp } from "@/lib/gtag";

const steps = ["Business", "Crops", "Schedule", "Payment"];

export function RestaurantOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    cuisineType: "",
  });

  async function submit() {
    const response = await fetch("/api/restaurant/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      trackSignUp("restaurant", { city: form.city, cuisine_type: form.cuisineType });
      router.push("/login");
    }
  }

  return (
    <GlassCard className="mx-auto max-w-2xl">
      <StepProgress steps={steps} currentStep={step} />
      <div className="mt-6 grid gap-4">
        {Object.entries(form)
          .filter(([key]) => {
            if (step === 0) return true;
            if (step === 1) return ["businessName", "cuisineType"].includes(key);
            if (step === 2) return ["city", "pincode"].includes(key);
            return ["email", "phone"].includes(key);
          })
          .map(([key, value]) => (
            <label key={key} className="text-sm font-semibold capitalize text-text-primary">
              {key}
              <input
                className="mt-2 h-11 w-full rounded-xl border border-sprout-800/20 bg-white/70 px-3 text-sm outline-none focus:border-sprout-600"
                type={key === "password" ? "password" : "text"}
                value={value}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
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
