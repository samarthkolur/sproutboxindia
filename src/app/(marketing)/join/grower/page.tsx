"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AddressMapPicker, type SelectedAddress } from "@/components/onboarding/AddressMapPicker";
import { ReviewList, type ReviewSection } from "@/components/join/ReviewList";
import { SummaryPanel, SummaryRow } from "@/components/join/Summary";
import { WizardShell } from "@/components/join/WizardShell";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { TextField } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { KIT_OPTIONS, PAYOUT_PER_TRAY } from "@/lib/constants";
import { trackSignUp } from "@/lib/gtag";
import {
  GROWER_STEPS,
  firstInvalidStep,
  fssaiDigits,
  validateGrowerStep,
  type FieldErrors,
  type GrowerFormData,
} from "@/lib/join-validation";
import { clearRegistrationPrefill, readRegistrationPrefill } from "@/lib/registration-prefill";

type SpaceType = "terrace" | "balcony" | "room" | "backyard";
type LightAccess = "natural" | "artificial" | "both";
type KitName = (typeof KIT_OPTIONS)[number]["name"];

const STEP = { personal: 0, location: 1, space: 2, kit: 3, compliance: 4, review: 5 } as const;

const SPACE_LABEL: Record<SpaceType, string> = {
  terrace: "Terrace",
  balcony: "Balcony",
  room: "Room",
  backyard: "Backyard",
};
const LIGHT_LABEL: Record<LightAccess, string> = { natural: "Natural", artificial: "Artificial", both: "Both" };

function GrowerWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [passwordPrefilled, setPasswordPrefilled] = useState(false);

  const [data, setData] = useState<GrowerFormData & { spaceType: SpaceType; lightAccess: LightAccess; kit: KitName }>({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    password: "",
    phone: "",
    city: "",
    address: "",
    pincode: "",
    spaceType: "terrace",
    areaSize: "",
    lightAccess: "natural",
    kit: "Starter",
    upiId: "",
    fssaiRegNumber: "",
  });

  // Details entered on /register arrive through sessionStorage, so nothing is typed twice.
  useEffect(() => {
    const prefill = readRegistrationPrefill("GROWER");
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

  const kit = KIT_OPTIONS.find((option) => option.name === data.kit) ?? KIT_OPTIONS[0];
  const validate = (target: number) => validateGrowerStep(target, data, { passwordPrefilled });

  const next = () => {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // After the re-render the first invalid field exists in the DOM: focus it.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus()
      );
      return;
    }
    setStep((current) => Math.min(current + 1, GROWER_STEPS.length - 1));
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
    // Every earlier step was checked on the way here, but "Edit" lets people change them.
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
      const res = await fetch("/api/grower/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, areaSize: Number(data.areaSize), fssaiRegNumber: fssaiDigits(data.fssaiRegNumber) || undefined }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (result.code === "EMAIL_EXISTS") {
          setEmailTaken(true);
          setStep(STEP.personal);
        }
        setServerError(result.error || "Registration failed");
        return;
      }
      // Fired only once the account really exists (the assignment's Acquisition KPI).
      trackSignUp("grower", { city: data.city, kit: data.kit, has_fssai: Boolean(data.fssaiRegNumber.trim()) });
      clearRegistrationPrefill();
      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const review: ReviewSection[] = [
    {
      title: "Personal",
      step: STEP.personal,
      rows: [
        { label: "Name", value: data.name },
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
      title: "Space",
      step: STEP.space,
      rows: [
        { label: "Space", value: `${SPACE_LABEL[data.spaceType]}, ${data.areaSize} sq ft` },
        { label: "Light", value: LIGHT_LABEL[data.lightAccess] },
      ],
    },
    {
      title: "Kit",
      step: STEP.kit,
      rows: [
        { label: "Kit", value: data.kit },
        { label: "UPI", value: data.upiId || "Not provided" },
      ],
    },
    {
      title: "Compliance",
      step: STEP.compliance,
      rows: [{ label: "FSSAI number", value: data.fssaiRegNumber.trim() || "Not provided" }],
    },
  ];

  return (
    <WizardShell
      title="Join as Grower"
      subtitle="Set up your growing profile in a few steps"
      steps={[...GROWER_STEPS]}
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
        <SummaryPanel title="Your starter kit">
          <SummaryRow label="Kit" value={kit.name} caption={kit.description} />
          <SummaryRow label="Trays" value={String(kit.trays)} caption="Grown at home, one crop per tray" />
          <SummaryRow label="Kit price" value={kit.price === 0 ? "Free" : `₹${kit.price}`} />
          <SummaryRow
            label="Payout per tray"
            value={`₹${PAYOUT_PER_TRAY}`}
            caption="For every tray that passes quality control"
          />
          <SummaryRow
            label="Potential earnings per cycle"
            value={`₹${PAYOUT_PER_TRAY * kit.trays}`}
            caption="If every tray passes quality control"
          />
        </SummaryPanel>
      }
    >
      {step === STEP.personal && (
        <>
          <TextField label="Full Name" autoComplete="name" value={data.name} onChange={onText("name")} error={errors.name} placeholder="Your full name" />
          <TextField label="Email" type="email" autoComplete="email" value={data.email} onChange={onText("email")} error={errors.email} placeholder="you@example.com" />
          {!passwordPrefilled && (
            <TextField label="Password" type="password" autoComplete="new-password" revealable value={data.password} onChange={onText("password")} error={errors.password} hint="At least 6 characters" />
          )}
          <TextField label="Phone" type="tel" autoComplete="tel" value={data.phone} onChange={onText("phone")} error={errors.phone} placeholder="+91 9876543210" />
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

      {step === STEP.space && (
        <>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Space Type</p>
            <ChoiceGroup
              ariaLabel="Space Type"
              compact
              choices={(Object.keys(SPACE_LABEL) as SpaceType[]).map((value) => ({ value, label: SPACE_LABEL[value] }))}
              value={data.spaceType}
              onChange={set("spaceType")}
            />
          </div>
          <TextField
            label="Area (sq ft)"
            type="number"
            inputMode="numeric"
            min={1}
            value={data.areaSize}
            onChange={onText("areaSize")}
            error={errors.areaSize}
            placeholder="e.g. 100"
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Light Access</p>
            <SegmentedControl
              ariaLabel="Light Access"
              className="w-full [&>button]:flex-1"
              options={(Object.keys(LIGHT_LABEL) as LightAccess[]).map((value) => ({ value, label: LIGHT_LABEL[value] }))}
              value={data.lightAccess}
              onChange={set("lightAccess")}
            />
          </div>
        </>
      )}

      {step === STEP.kit && (
        <>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Choose Your Kit</p>
            <ChoiceGroup
              ariaLabel="Choose Your Kit"
              columns={1}
              choices={KIT_OPTIONS.map((option) => ({
                value: option.name,
                label: option.name,
                description: option.description,
                trailing: (
                  <span className="block text-right">
                    {option.price === 0 ? "Free" : `₹${option.price}`}
                    <span className="block text-micro font-normal text-ink-muted">{`${option.trays} trays`}</span>
                  </span>
                ),
              }))}
              value={data.kit}
              onChange={set("kit")}
            />
          </div>
          <TextField
            label="UPI ID (for payouts)"
            optional
            autoComplete="off"
            value={data.upiId}
            onChange={onText("upiId")}
            error={errors.upiId}
            placeholder="name@upi"
            hint="We pay you here. You can add it later."
          />
        </>
      )}

      {step === STEP.compliance && (
        <>
          <p className="text-sm text-ink-soft">
            Indian food safety law (FSSAI) requires a registration before you can supply restaurants commercially. You
            can leave this blank for now and add it later. Our team checks each number we receive.
          </p>
          <TextField
            label="FSSAI Registration Number"
            optional
            inputMode="numeric"
            autoComplete="off"
            value={data.fssaiRegNumber}
            onChange={onText("fssaiRegNumber")}
            error={errors.fssaiRegNumber}
            hint="14 digits, printed on your FSSAI certificate"
          />
        </>
      )}

      {step === STEP.review && <ReviewList sections={review} onEdit={goTo} />}
    </WizardShell>
  );
}

export default function GrowerJoinPage() {
  return (
    <Suspense fallback={<div role="status" className="py-24 text-center text-ink-muted">Loading…</div>}>
      <GrowerWizard />
    </Suspense>
  );
}
