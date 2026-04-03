"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const glassVariants = cva(
  [
    "relative rounded-2xl border",
    "bg-white/[0.04] border-white/[0.06]",
    "backdrop-blur-xl",
    "shadow-xl shadow-black/10",
  ].join(" "),
  {
    variants: {
      intensity: {
        /** Subtle glass — very light blur + low opacity */
        light: "bg-white/[0.02] border-white/[0.04] backdrop-blur-lg",
        /** Default glass */
        medium: "bg-white/[0.04] border-white/[0.06] backdrop-blur-xl",
        /** Heavy glass — more visible frosted effect */
        heavy: "bg-white/[0.08] border-white/[0.10] backdrop-blur-2xl saturate-150",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      rounded: {
        default: "rounded-2xl",
        lg: "rounded-3xl",
        full: "rounded-full",
        none: "rounded-none",
      },
      /** Add grain texture inside this container */
      grain: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      intensity: "medium",
      padding: "default",
      rounded: "default",
      grain: false,
    },
  }
)

export interface GlassContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassVariants> {
  /** Render as a Framer Motion div with fade-in-up entrance */
  animated?: boolean
}

/* ── Static GlassContainer ─────────────────────── */
const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className, intensity, padding, rounded, grain, animated, children, ...props }, ref) => {
    const classes = cn(glassVariants({ intensity, padding, rounded, grain, className }))

    if (animated) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className={classes}
          {...(props as HTMLMotionProps<"div">)}
        >
          {grain && <GrainOverlay />}
          <div className="relative z-[1]">{children}</div>
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {grain && <GrainOverlay />}
        <div className="relative z-[1]">{children}</div>
      </div>
    )
  }
)
GlassContainer.displayName = "GlassContainer"

/* ── Internal grain overlay ────────────────────── */
function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-[0.04]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  )
}

export { GlassContainer, glassVariants }
