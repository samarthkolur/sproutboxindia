"use client"

import { motion } from "framer-motion"
import { MotionCard, CardContent } from "@/components/ui/Card"

const features = [
  {
    emoji: "🛒",
    title: "Easy Ordering",
    description: "Select your microgreens, set the quantity in kg, choose a delivery date — order placed in seconds.",
  },
  {
    emoji: "🔄",
    title: "Subscription Plans",
    description: "Set up recurring daily or weekly deliveries. Never worry about reordering — your supply runs on autopilot.",
  },
  {
    emoji: "📍",
    title: "Real‑Time Tracking",
    description: "Follow your order from placement through growing, harvest, and delivery. Always know where your greens are.",
  },
  {
    emoji: "✅",
    title: "Quality Assurance",
    description: "Every batch is inspected before dispatch. Consistent weight, vibrant color, and peak freshness — guaranteed.",
  },
  {
    emoji: "🌱",
    title: "Harvested Fresh",
    description: "Your microgreens are harvested the same day they're delivered. No cold storage, no shelf time, just peak flavor.",
  },
  {
    emoji: "📦",
    title: "Flexible Delivery",
    description: "Choose one‑time orders or recurring subscriptions. Adjust quantities and schedules anytime from your dashboard.",
  },
]

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[400px] w-[600px] rounded-full bg-sprout-500/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-sprout-400">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your kitchen needs,{" "}
            <span className="gradient-text-sprout">nothing it doesn&apos;t</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A simple, powerful platform designed for restaurants that demand freshness and reliability.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => (
            <MotionCard
              key={item.title}
              variant="glass"
              hover="glow"
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }}
            >
              <CardContent className="mt-0">
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  )
}
