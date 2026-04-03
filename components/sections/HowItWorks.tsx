"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Place Your Order",
    description: "Select your microgreens, set the quantity, and choose a delivery date — or set up a recurring subscription.",
  },
  {
    number: "02",
    title: "Demand Is Aggregated",
    description: "We bundle orders from restaurants in your area and convert demand into tray-level production tasks.",
  },
  {
    number: "03",
    title: "Assigned to Growers",
    description: "Production tasks are distributed to our trained network of local home growers, each with verified growing setups.",
  },
  {
    number: "04",
    title: "Grown With Care",
    description: "Growers follow day‑by‑day growing instructions. They track progress, upload photos, and hit quality milestones.",
  },
  {
    number: "05",
    title: "Harvested & Quality Checked",
    description: "On harvest day, greens are collected, weighed, inspected for quality, and packed for delivery.",
  },
  {
    number: "06",
    title: "Delivered to Your Kitchen",
    description: "Fresh, same‑day harvested microgreens arrive at your restaurant — ready to plate and serve.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-sprout-400">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From order to plate in{" "}
            <span className="gradient-text-sprout">6 simple steps</span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-sprout-500/40 via-sprout-500/20 to-transparent md:left-1/2 md:-translate-x-px" />

          <div className="space-y-12">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }}
                  className={`relative flex items-start gap-6 md:gap-0 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-[18px] top-1 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-sprout-500 bg-background md:left-1/2 md:-translate-x-1/2">
                    <div className="h-2 w-2 rounded-full bg-sprout-400" />
                  </div>

                  {/* Card */}
                  <div
                    className={`ml-14 w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-lg md:ml-0 md:w-[calc(50%-2rem)] ${
                      isEven ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
                    }`}
                  >
                    <span className="text-xs font-bold text-sprout-400">{step.number}</span>
                    <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
