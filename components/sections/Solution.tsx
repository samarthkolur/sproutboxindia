"use client"

import { motion } from "framer-motion"
import { GlassContainer } from "@/components/ui/GlassContainer"

const pillars = [
  {
    icon: (
      <svg className="size-6 text-sprout-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Demand‑Driven Production",
    description: "You place orders. We grow exactly what you need — no overproduction, no waste, no guesswork.",
  },
  {
    icon: (
      <svg className="size-6 text-sprout-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Local Grower Network",
    description: "A distributed network of trained home growers produces your microgreens with care and consistency.",
  },
  {
    icon: (
      <svg className="size-6 text-sprout-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Quality‑Assured Delivery",
    description: "Every harvest is quality checked before delivery. You receive only the freshest, most vibrant greens.",
  },
]

export default function Solution() {
  return (
    <section id="solution" className="relative py-24 px-6">
      {/* Subtle green glow behind the section */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[500px] w-[700px] rounded-full bg-sprout-500/[0.04] blur-3xl" />
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
            The Solution
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Meet <span className="gradient-text-sprout">SproutBox</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A demand‑driven microgreens supply platform — connecting restaurants directly to local growers for the freshest produce possible.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {pillars.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" as const }}
            >
              <GlassContainer grain className="h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sprout-500/10 border border-sprout-500/20">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </GlassContainer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
