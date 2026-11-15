"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// 16px text on purpose: anything smaller makes iOS zoom the page on focus.
export const controlClass =
  "w-full rounded-tile border border-hairline bg-panel-solid/80 px-4 py-3 text-base text-ink placeholder:text-ink-muted outline-none transition-colors focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60 aria-[invalid=true]:border-risk aria-[invalid=true]:ring-risk/20";

interface ControlA11y {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

// Label + control + hint/error, wired together for assistive tech. The control is
// a render prop so text inputs, selects and anything else share one shell.
export function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (control: ControlA11y) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const showHint = Boolean(hint) && !error;
  const describedBy = error ? errorId : showHint ? hintId : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        <span>{label}</span>
        {optional ? <span className="text-micro font-normal text-ink-muted">Optional</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {showHint ? (
        <p id={hintId} className="mt-1.5 text-micro text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-micro font-medium text-risk">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  /** Password fields only: adds a show/hide button. */
  revealable?: boolean;
};

export function TextField({ label, hint, error, optional, className, revealable, type, ...input }: TextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && revealed ? "text" : type;

  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(control) => (
        <div className="relative">
          <input
            {...input}
            {...control}
            type={effectiveType}
            className={cn(controlClass, isPassword && revealable && "pr-12")}
          />
          {isPassword && revealable ? (
            <button
              type="button"
              data-no-global-loading
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              className="absolute inset-y-0 right-1.5 my-auto flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      )}
    </Field>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
};

export function SelectField({ label, hint, error, optional, className, children, ...select }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {(control) => (
        <select {...select} {...control} className={controlClass}>
          {children}
        </select>
      )}
    </Field>
  );
}
