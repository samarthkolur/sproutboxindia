"use client"

import { motion } from "framer-motion"
import { MotionCard, CardContent } from "@/components/ui/Card"

const problems = [
  {
    icon: "🥬",
    title: "Unreliable Suppliers",
    description:
      "Traditional supply chains are unpredictable. Deliveries arrive late, quality varies wildly, and you never know what you'll actually receive.",
  },
  {
    icon: "🗑️",
    title: "Wasteful Bulk Orders",
    description:
      "You're forced to order in bulk. Half of it wilts before you use it. Money and produce — wasted every single week.",
  },
  {
    icon: "📉",
    title: "Inconsistent Quality",
    description:
      "Your dishes depend on fresh, vibrant microgreens. But what arrives is often days old, limp, and far from what your menu promises.",
  },
]

export default function Problem() {
  return (
    <section id="problem" className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-sprout-400">
            The Problem
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Sourcing microgreens shouldn&apos;t be this{" "}
            <span className="text-destructive">frustrating</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Restaurants struggle with unreliable produce supply, inconsistent freshness, and wasteful ordering processes.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((item, i) => (
            <MotionCard
              key={item.title}
              variant="glass"
              hover="lift"
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" as const }}
            >
              <CardContent className="mt-0">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
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
