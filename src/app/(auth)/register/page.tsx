"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sprout, UtensilsCrossed } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { TextField } from "@/components/ui/field";
import { saveRegistrationPrefill } from "@/lib/registration-prefill";
import { MIN_PASSWORD_LENGTH, isValidEmail } from "@/lib/validation";

type Role = "GROWER" | "RESTAURANT";
type Errors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

const ROLE_CHOICES = [
  { value: "GROWER", label: "Grower", description: "Grow from home", icon: <Sprout className="h-6 w-6" aria-hidden="true" /> },
  {
    value: "RESTAURANT",
    label: "Restaurant",
    description: "Order fresh produce",
    icon: <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />,
  },
];

// V2: say what happens next, because no account exists until the last step of the next page.
const NEXT_STEP: Record<Role, string> = {
  GROWER: "Next, tell us about your space and kit. Your account is created when you submit the last step.",
  RESTAURANT:
    "Next, tell us about your kitchen and what you'd like to order. Your account is created when you submit the last step.",
};

function validate(data: { name: string; email: string; password: string; confirmPassword: string }): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = "Enter your full name.";
  if (!data.email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address.";
  if (data.password.length < MIN_PASSWORD_LENGTH) errors.password = "Password must be at least 6 characters.";
  if (!data.confirmPassword) errors.confirmPassword = "Re-enter your password.";
  else if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "GROWER" as Role,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [formError, setFormError] = useState("");

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the person starts fixing it.
    setErrors((prev) => (prev[field as keyof Errors] ? { ...prev, [field]: undefined } : prev));
  };

  // After a failed submit, move focus to the first field that needs attention.
  useEffect(() => {
    if (submitCount === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [submitCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const found = validate(formData);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setSubmitCount((count) => count + 1);
      return;
    }

    try {
      saveRegistrationPrefill({
        role: formData.role,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      router.push(formData.role === "GROWER" ? "/join/grower" : "/join/restaurant");
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <BrandLogo className="mb-6 sm:mb-8" markClassName="h-10 w-10" textClassName="text-xl" />

      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Create your account</h1>
      <p className="mb-8 text-sm text-ink-soft">Join SproutBox as a grower or restaurant partner</p>

      {formError && (
        <div role="alert" className="mb-6 rounded-tile bg-risk-soft px-4 py-3 text-sm text-risk">
          {formError}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            I am a
          </p>
          <ChoiceGroup
            ariaLabel="I am a"
            choices={ROLE_CHOICES}
            value={formData.role}
            onChange={(role) => setFormData((prev) => ({ ...prev, role: role as Role }))}
          />
          <p className="mt-2.5 text-micro text-ink-muted">{NEXT_STEP[formData.role]}</p>
        </div>

        <TextField
          label="Full Name"
          autoComplete="name"
          value={formData.name}
          onChange={set("name")}
          error={errors.name}
          placeholder="Your full name"
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={set("email")}
          error={errors.email}
          placeholder="you@example.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            revealable
            value={formData.password}
            onChange={set("password")}
            error={errors.password}
            hint="At least 6 characters"
          />
          <TextField
            label="Confirm"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={set("confirmPassword")}
            error={errors.confirmPassword}
          />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="my-8 flex items-center gap-4 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-hairline" />
        <span>Already have an account?</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-full border-hairline bg-transparent">
        <Link href="/login">Sign in instead</Link>
      </Button>
    </div>
  );
}
