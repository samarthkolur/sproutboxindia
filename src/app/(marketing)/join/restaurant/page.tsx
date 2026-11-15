"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AddressMapPicker, type SelectedAddress } from "@/components/onboarding/AddressMapPicker";
import { ReviewList, type ReviewSection } from "@/components/join/ReviewList";
import { SummaryPanel, SummaryRow } from "@/components/join/Summary";
import { WizardShell } from "@/components/join/WizardShell";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { SelectField, TextField } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  CROP_CYCLE_DAYS,
  CROP_DISPLAY_NAMES,
  CROP_IMAGES,
  CROP_PRICE_PER_KG,
  CROP_TYPES,
  type CropType,
} from "@/lib/constants";
import { trackSignUp } from "@/lib/gtag";
import {
  RESTAURANT_STEPS,
  firstInvalidStep,
  validateRestaurantStep,
  type FieldErrors,
  type RestaurantFormData,
} from "@/lib/join-validation";
import { clearRegistrationPrefill, readRegistrationPrefill } from "@/lib/registration-prefill";

type Frequency = "weekly" | "biweekly";

const STEP = { business: 0, location: 1, crops: 2, schedule: 3, review: 4 } as const;

const FREQUENCY_LABEL: Record<Frequency, string> = { weekly: "Weekly", biweekly: "Biweekly" };
const FREQUENCY_CAPTION: Record<Frequency, string> = { weekly: "Every week", biweekly: "Every 2 weeks" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function RestaurantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [passwordPrefilled, setPasswordPrefilled] = useState(false);

  const [data, setData] = useState<
    RestaurantFormData & {
      cuisineType: string;
      selectedCrops: CropType[];
      deliveryFrequency: Frequency;
      preferredDay: string;
    }
  >({
    businessName: "",
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    password: "",
    phone: "",
    gstNumber: "",
    cuisineType: "",
    address: "",
    city: "",
    pincode: "",
    selectedCrops: [],
    deliveryFrequency: "weekly",
    preferredDay: "Monday",
  });

  useEffect(() => {
    const prefill = readRegistrationPrefill("RESTAURANT");
    if (!prefill) return;
    setData((prev) => ({ ...prev, name: prefill.name, email: prefill.email, password: prefill.password }));
    setPasswordPrefilled(Boolean(prefill.password));
  }, []);

  const set = (field: keyof typeof data) => (value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };
  const onText = (field: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) => set(field)(e.target.value);

  const updateAddress = (address: SelectedAddress) => {
    setSelectedAddress(address);
    setData((prev) => ({ ...prev, address: address.address, city: address.city, pincode: address.pincode }));
    setErrors((prev) => ({ ...prev, address: undefined }));
  };

  const validate = (target: number) => validateRestaurantStep(target, data, { passwordPrefilled });

  const next = () => {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus());
      return;
    }
    setStep((current) => Math.min(current + 1, RESTAURANT_STEPS.length - 1));
  };
  const back = () => {
    setErrors({});
    setServerError("");
    setStep((current) => Math.max(current - 1, 0));
  };
  const goTo = (target: number) => {
    setErrors({});
    setStep(target);
  };

  const submit = async () => {
    const broken = firstInvalidStep(validate, STEP.review);
    if (broken !== null) {
      setErrors(validate(broken));
      setStep(broken);
      return;
    }

    setLoading(true);
    setServerError("");
    setEmailTaken(false);
    try {
      const res = await fetch("/api/restaurant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, lat: selectedAddress?.lat, lng: selectedAddress?.lng }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (result.code === "EMAIL_EXISTS") {
          setEmailTaken(true);
          setStep(STEP.business);
        }
        setServerError(result.error || "Registration failed");
        return;
      }
      trackSignUp("restaurant", {
        city: data.city,
        cuisine_type: data.cuisineType || undefined,
        crops_selected: data.selectedCrops.length,
        delivery_frequency: data.deliveryFrequency,
      });
      clearRegistrationPrefill();
      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chosen = data.selectedCrops;
  const cycle = chosen.map((crop) => CROP_CYCLE_DAYS[crop]);

  const review: ReviewSection[] = [
    {
      title: "Business",
      step: STEP.business,
      rows: [
        { label: "Restaurant", value: data.businessName },
        { label: "Contact", value: data.name },
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone },
      ],
    },
    {
      title: "Location",
      step: STEP.location,
      rows: [
        { label: "City", value: data.city },
        { label: "PIN", value: data.pincode },
        { label: "Address", value: data.address },
      ],
    },
    {
      title: "Crops",
      step: STEP.crops,
      rows: [
        {
          label: "Crops",
          value:
            chosen.length === 0 ? (
              "None selected"
            ) : (
              <ul>
                {chosen.map((crop) => (
                  <li key={crop}>{CROP_DISPLAY_NAMES[crop]}</li>
                ))}
              </ul>
            ),
        },
      ],
    },
    {
      title: "Schedule",
      step: STEP.schedule,
      rows: [
        { label: "Frequency", value: FREQUENCY_LABEL[data.deliveryFrequency] },
        { label: "Day", value: data.preferredDay },
      ],
    },
  ];

  return (
    <WizardShell
      title="Partner as Restaurant"
      subtitle="Set up your restaurant profile and preferences"
      steps={[...RESTAURANT_STEPS]}
      step={step}
      error={serverError}
      errorAction={
        emailTaken ? (
          <Button asChild size="sm" variant="outline" className="rounded-full border-risk/40 bg-transparent text-risk hover:bg-risk/10">
            <Link href="/login">Sign in instead</Link>
          </Button>
        ) : undefined
      }
      loading={loading}
      submitLabel="Submit Application"
      backHref="/register"
      backLabel="Register"
      onBack={back}
      onNext={next}
      onSubmit={submit}
      summary={
        <SummaryPanel title="Your menu">
          <SummaryRow
            label="Crops"
            value={String(chosen.length)}
            caption={chosen.length === 0 ? "Pick the greens you use most" : "You place each order yourself, from the catalog"}
          />
          {chosen.length > 0 && (
            <>
              <ul className="space-y-1.5">
                {chosen.map((crop) => (
                  <li key={crop} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink">{CROP_DISPLAY_NAMES[crop]}</span>
                    <span className="tabular-nums text-ink-muted">{`₹${CROP_PRICE_PER_KG[crop]}/kg`}</span>
                  </li>
                ))}
              </ul>
              <SummaryRow
                label="Grow time"
                value={Math.min(...cycle) === Math.max(...cycle) ? String(cycle[0]) : `${Math.min(...cycle)}–${Math.max(...cycle)}`}
                caption="Days from sowing to harvest, depending on the crop"
              />
            </>
          )}
          <SummaryRow
            label="Delivery rhythm"
            value={FREQUENCY_LABEL[data.deliveryFrequency]}
            caption={FREQUENCY_CAPTION[data.deliveryFrequency]}
          />
        </SummaryPanel>
      }
    >
      {step === STEP.business && (
        <>
          <TextField label="Restaurant Name" value={data.businessName} onChange={onText("businessName")} error={errors.businessName} placeholder="Your restaurant name" />
          <TextField label="Contact Name" autoComplete="name" value={data.name} onChange={onText("name")} error={errors.name} placeholder="Primary contact person" />
          <TextField label="Email" type="email" autoComplete="email" value={data.email} onChange={onText("email")} error={errors.email} placeholder="restaurant@example.com" />
          {!passwordPrefilled && (
            <TextField label="Password" type="password" autoComplete="new-password" revealable value={data.password} onChange={onText("password")} error={errors.password} hint="At least 6 characters" />
          )}
          <TextField label="Phone" type="tel" autoComplete="tel" value={data.phone} onChange={onText("phone")} error={errors.phone} placeholder="+91 9876543210" />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Cuisine" optional value={data.cuisineType} onChange={onText("cuisineType")} placeholder="e.g. South Indian" />
            <TextField label="GST Number" optional value={data.gstNumber} onChange={onText("gstNumber")} error={errors.gstNumber} placeholder="22AAAAA0000A1Z5" />
          </div>
        </>
      )}

      {step === STEP.location && (
        <>
          <AddressMapPicker value={selectedAddress} onChange={updateAddress} />
          {errors.address && (
            <p role="alert" className="text-sm font-medium text-risk">
              {errors.address}
            </p>
          )}
        </>
      )}

      {step === STEP.crops && (
        <>
          <p className="text-sm text-ink-soft">
            Select the microgreens you&apos;d like to order regularly. This helps us plan supply; you still place each
            order yourself.
          </p>
          <ChoiceGroup
            multiple
            ariaLabel="Crops"
            choices={CROP_TYPES.map((crop) => ({
              value: crop,
              label: CROP_DISPLAY_NAMES[crop],
              description: `${CROP_CYCLE_DAYS[crop]} days`,
              trailing: `₹${CROP_PRICE_PER_KG[crop]}/kg`,
              icon: (
                <span className="relative block h-11 w-11 overflow-hidden rounded-xl">
                  <Image src={CROP_IMAGES[crop]} alt="" fill sizes="44px" className="object-cover" />
                </span>
              ),
            }))}
            values={data.selectedCrops}
            onChange={(values) => setData((prev) => ({ ...prev, selectedCrops: values as CropType[] }))}
          />
        </>
      )}

      {step === STEP.schedule && (
        <>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Delivery Frequency</p>
            <SegmentedControl
              ariaLabel="Delivery Frequency"
              className="w-full [&>button]:flex-1"
              options={(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((value) => ({ value, label: FREQUENCY_LABEL[value] }))}
              value={data.deliveryFrequency}
              onChange={set("deliveryFrequency")}
            />
            <p className="mt-2 text-micro text-ink-muted">{FREQUENCY_CAPTION[data.deliveryFrequency]}</p>
          </div>
          <SelectField label="Preferred Delivery Day" value={data.preferredDay} onChange={(e) => set("preferredDay")(e.target.value)}>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </SelectField>
        </>
      )}

      {step === STEP.review && <ReviewList sections={review} onEdit={goTo} />}
    </WizardShell>
  );
}

export default function RestaurantJoinPage() {
  return (
    <Suspense fallback={<div role="status" className="py-24 text-center text-ink-muted">Loading…</div>}>
      <RestaurantWizard />
    </Suspense>
  );
}
