"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    /* Base */
    "w-full rounded-2xl border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/60",
    "outline-none transition-all duration-200",
    /* Focus ring */
    "focus:border-sprout-500/50 focus:ring-2 focus:ring-sprout-500/20",
    /* Disabled */
    "disabled:cursor-not-allowed disabled:opacity-50",
    /* Invalid */
    "aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    /* File input */
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Glass input */
        glass:
          "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl shadow-sm shadow-black/5 hover:border-white/[0.14]",
        /* Solid dark input */
        solid:
          "bg-secondary border-border hover:border-white/[0.15]",
        /* Minimal underline input */
        minimal:
          "rounded-none border-0 border-b border-white/[0.10] px-0 focus:border-sprout-500/60 focus:ring-0",
      },
      inputSize: {
        default: "h-10",
        sm: "h-8 text-xs px-3",
        lg: "h-12 text-base px-5",
      },
    },
    defaultVariants: {
      variant: "glass",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Optional label displayed above the input */
  label?: string
  /** Optional error message displayed below the input */
  error?: string
  /** Optional helper text displayed below the input */
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, variant, inputSize, label, error, helperText, id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-muted-foreground"
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          data-slot="input"
          aria-invalid={!!error}
          className={cn(inputVariants({ variant, inputSize, className }))}
          {...props}
        />

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground/60">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
