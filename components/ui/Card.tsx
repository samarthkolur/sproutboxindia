"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative overflow-hidden rounded-2xl border transition-all duration-300",
  {
    variants: {
      variant: {
        /* Default glass card */
        glass:
          "bg-white/[0.04] border-white/[0.06] backdrop-blur-xl shadow-xl shadow-black/10",
        /* Solid dark card */
        solid:
          "bg-card border-border shadow-lg",
        /* Outlined card */
        outline:
          "bg-transparent border-white/[0.08]",
      },
      hover: {
        glow: "",
        lift: "",
        none: "",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "glass",
      hover: "glow",
      padding: "default",
    },
  }
)

/* ── Static Card ───────────────────────────────── */
const Card = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, hover, padding, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(cardVariants({ variant, hover, padding, className }))}
    {...props}
  />
))
Card.displayName = "Card"

/* ── Motion Card (Framer Motion) ───────────────── */
const MotionCard = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & VariantProps<typeof cardVariants>
>(({ className, variant, hover = "glow", padding, ...props }, ref) => {
  const hoverAnimation =
    hover === "glow"
      ? {
          scale: 1.02,
          boxShadow: "0 0 40px 0 rgba(74, 222, 128, 0.12)",
        }
      : hover === "lift"
        ? { y: -4, scale: 1.01 }
        : {}

  return (
    <motion.div
      ref={ref}
      data-slot="card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={hoverAnimation}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className={cn(cardVariants({ variant, hover, padding, className }))}
      {...props}
    />
  )
})
MotionCard.displayName = "MotionCard"

/* ── Sub-components ────────────────────────────── */
const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("mt-4", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn("mt-6 flex items-center gap-3", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  MotionCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
}
