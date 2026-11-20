"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { event, setUserProperties } from "@/lib/gtag";
import { isTracked, type Assignments, type ExperimentKey } from "@/lib/experiments/config";

type ExperimentContextValue = {
  assignments: Assignments;
  trackable: boolean;
  /** Variant for one experiment ("control" if unknown). */
  variant: (key: ExperimentKey) => string;
  /** GA4 event with the running experiments' variants attached. */
  trackWithExperiments: (name: string, params?: Record<string, string | number | boolean | undefined>) => void;
};

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

/** exp_hero_headline: "b", … for running experiments only. */
function runningVariantParams(assignments: Assignments): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, variant] of Object.entries(assignments)) {
    if (isTracked(key as ExperimentKey)) out[`exp_${key}`] = variant;
  }
  return out;
}

export function ExperimentProvider({
  assignments,
  trackable,
  children,
}: {
  assignments: Assignments;
  trackable: boolean;
  children: ReactNode;
}) {
  // GA4 user properties tag every later event (sign_up, purchase, …) with the
  // visitor's variants, so any event can be split by experiment in reports.
  useEffect(() => {
    if (!trackable) return;
    const props = runningVariantParams(assignments);
    if (Object.keys(props).length) setUserProperties(props);
  }, [assignments, trackable]);

  const variant = useCallback((key: ExperimentKey) => assignments[key] ?? "control", [assignments]);

  const trackWithExperiments = useCallback<ExperimentContextValue["trackWithExperiments"]>(
    (name, params) => {
      if (!trackable) return;
      event(name, { ...runningVariantParams(assignments), ...params });
    },
    [assignments, trackable]
  );

  const value = useMemo(
    () => ({ assignments, trackable, variant, trackWithExperiments }),
    [assignments, trackable, variant, trackWithExperiments]
  );

  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
}

export function useExperiments(): ExperimentContextValue {
  const ctx = useContext(ExperimentContext);
  if (ctx) return ctx;
  // Outside the provider: behave as control and track nothing.
  return {
    assignments: {} as Assignments,
    trackable: false,
    variant: () => "control",
    trackWithExperiments: () => {},
  };
}

/**
 * Returns the variant and fires `experiment_exposure` once per browser
 * session when the component using it first renders — i.e. when the visitor
 * actually saw the thing being tested.
 */
export function useVariant(key: ExperimentKey): string {
  const { variant, trackable } = useExperiments();
  const v = variant(key);

  useEffect(() => {
    if (!trackable || !isTracked(key)) return;
    const storageKey = `sb_exp_seen_${key}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // storage blocked — still record the exposure
    }
    event("experiment_exposure", {
      experiment: key,
      variant: v,
      page_path: window.location.pathname,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    });
  }, [key, v, trackable]);

  return v;
}
