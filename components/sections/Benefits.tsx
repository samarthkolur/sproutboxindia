"use client"

import { motion } from "framer-motion"
import { MotionCard, CardContent } from "@/components/ui/Card"

const benefits = [
  {
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Harvested Same‑Day",
    description: "Your microgreens are cut hours before delivery — not days. Peak nutrition, peak flavor, every single time.",
  },
  {
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Zero Waste Supply",
    description: "We grow only what you order. No overproduction, no excess stock rotting on shelves. Demand‑driven, waste‑free.",
  },
  {
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Lower Costs",
    description: "Skip the middlemen. Direct from grower to kitchen means better prices and fresher produce for your restaurant.",
  },
  {
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Reliable Supply",
    description: "Our distributed grower network means your supply never depends on a single source. Consistent, dependable, always.",
  },
]

export default function Benefits() {
  return (
    <section id="benefits" className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-sprout-400">
            Benefits
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Why restaurants <span className="gradient-text-sprout">trust</span> SproutBox
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            It&apos;s not just a supplier — it&apos;s a smarter way to source the freshest microgreens for your kitchen.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {benefits.map((item, i) => (
            <MotionCard
              key={item.title}
              variant="glass"
              hover="glow"
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" as const }}
            >
              <CardContent className="mt-0 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sprout-500/10 text-sprout-400 border border-sprout-500/20">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  )
}
