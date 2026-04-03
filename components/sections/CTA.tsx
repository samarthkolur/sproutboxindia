"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MotionButton } from "@/components/ui/button"
import { GlassContainer } from "@/components/ui/GlassContainer"

export default function CTA() {
  return (
    <section id="cta" className="relative py-24 px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[700px] rounded-full bg-sprout-500/[0.06] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="relative mx-auto max-w-3xl"
      >
        <GlassContainer
          intensity="heavy"
          padding="xl"
          rounded="lg"
          grain
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-sprout-400">
            Ready to Go Fresh?
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Get farm‑fresh microgreens{" "}
            <span className="gradient-text-sprout">delivered</span> to your kitchen
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join restaurants already sourcing the freshest microgreens through SproutBox.
            Place your first order today — it takes less than a minute.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <MotionButton
                size="lg"
                variant="primary"
                className="h-12 rounded-xl px-8 text-base"
              >
                Start Ordering
              </MotionButton>
            </Link>
            <MotionButton
              size="lg"
              variant="glass"
              className="h-12 rounded-xl px-8 text-base"
            >
              <a href="#how-it-works">Learn More</a>
            </MotionButton>
          </div>

          <p className="mt-5 text-xs text-muted-foreground/60">
            No minimum order · Flexible schedules · Same‑day harvest
          </p>
        </GlassContainer>
      </motion.div>
    </section>
  )
}
