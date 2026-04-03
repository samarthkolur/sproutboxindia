"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"
import { forwardRef } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* ── Green gradient primary ─────────────── */
        primary:
          "bg-gradient-to-r from-sprout-500 to-sprout-400 text-white shadow-lg shadow-sprout-500/25 hover:from-sprout-400 hover:to-sprout-300 hover:shadow-sprout-400/30",
        /* ── Glassmorphism secondary ────────────── */
        glass:
          "bg-white/[0.06] text-foreground backdrop-blur-xl border-white/[0.08] shadow-lg shadow-black/10 hover:bg-white/[0.10] hover:border-white/[0.12]",
        /* ── ShadCN defaults kept ───────────────── */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-5",
        xs: "h-7 gap-1 rounded-xl px-3 text-xs",
        sm: "h-8 gap-1.5 rounded-xl px-4 text-xs",
        lg: "h-12 gap-2 px-8 text-base",
        xl: "h-14 gap-2.5 px-10 text-lg rounded-2xl",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

/* ── Static Button (no animation) ──────────────── */
function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/* ── Motion Button (Framer Motion wrapper) ─────── */
const MotionButton = forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button"> & VariantProps<typeof buttonVariants>
>(({ className, variant = "primary", size = "default", ...props }, ref) => (
  <motion.button
    ref={ref}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
))
MotionButton.displayName = "MotionButton"

export { Button, MotionButton, buttonVariants }
