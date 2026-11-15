"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "./WizardStepper";

interface WizardShellProps {
  title: string;
  subtitle: string;
  steps: string[];
  step: number;
  /** Live summary of what the person has chosen so far (V2). */
  summary: ReactNode;
  children: ReactNode;
  error?: string;
  errorAction?: ReactNode;
  loading: boolean;
  submitLabel: string;
  backHref: string;
  backLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

// Shared frame for the grower and restaurant sign-up wizards: stepper, the step's
// form, Back/Continue, and a summary panel beside it. Enter advances (it is a real
// form), and focus moves to the step heading so a screen reader announces each step.
export function WizardShell({
  title,
  subtitle,
  steps,
  step,
  summary,
  children,
  error,
  errorAction,
  loading,
  submitLabel,
  backHref,
  backLabel,
  onBack,
  onNext,
  onSubmit,
}: WizardShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-light tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base text-ink-soft">{subtitle}</p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (loading) return;
              if (isLast) onSubmit();
              else onNext();
            }}
            className="panel p-5 sm:p-8"
          >
            <WizardStepper steps={steps} current={step} />

            <div className="mt-8">
              <p className="text-micro text-ink-muted">{`Step ${step + 1} of ${steps.length}`}</p>
              <h2 ref={headingRef} tabIndex={-1} className="mt-1 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink outline-none">
                {steps[step]}
              </h2>
            </div>

            {error && (
              <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-tile bg-risk-soft px-4 py-3 text-sm text-risk">
                <p>{error}</p>
                {errorAction}
              </div>
            )}

            <div className="mt-6 space-y-5">{children}</div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-hairline/70 pt-5">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={onBack} disabled={loading} className="rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <Button asChild variant="ghost" className="rounded-full">
                  <Link href={backHref}>
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    {backLabel}
                  </Link>
                </Button>
              )}

              <Button type="submit" size="lg" disabled={loading} className="rounded-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Submitting…
                  </>
                ) : isLast ? (
                  submitLabel
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <aside aria-label="Summary" className="lg:sticky lg:top-24">
            {summary}
          </aside>
        </div>
      </div>
    </div>
  );
}
