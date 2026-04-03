"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion"
import { Sprout, Truck, PackageCheck, ThermometerSun } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: "grow",
    title: "Eco-Grow",
    description: "Nurtured in climate-controlled urban facilities, ensuring peak nutrition.",
    icon: ThermometerSun,
  },
  {
    id: "collect",
    title: "Urban Harvest",
    description: "Freshly harvested trays gathered from certified local farmers.",
    icon: Sprout,
  },
  {
    id: "process",
    title: "Quality Hub",
    description: "Every tray is quality-checked, weighed, and eco-packed.",
    icon: PackageCheck,
  },
  {
    id: "deliver",
    title: "Rapid Delivery",
    description: "Rapid delivery to your kitchen door, under 4 hours.",
    icon: Truck,
  },
]

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // STEP 1 & 3 — FIX SCROLL MAPPING FOR STICKY CONTAINER
  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ["start start", "end end"] 
  })

  // STEP 9 — SMOOTHNESS FIX
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 60, 
    damping: 20,
    restDelta: 0.001 
  })

  // STEP 10 — SMOOTH ENTRY
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0])

  // STEP 7 — TRUCK MOVEMENT
  const truckPosition = useTransform(smoothProgress, [0, 1], ["0%", "100%"])

  // STEP 8 — PROPER ACTIVE STEP DETECTION
  const [activeStep, setActiveStep] = useState(0)

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const stepsCount = steps.length
    
    // Calculate active step index dynamically based on scroll thresholds
    // Make sure it doesn't calculate the last step at exactly 1.0 to prevent glitches
    const currentStepIndex = Math.min(stepsCount - 1, Math.max(0, Math.floor(latest * stepsCount)))
    
    if (currentStepIndex !== activeStep) {
      setActiveStep(currentStepIndex)
    }

    // STEP 11 — DEBUG MODE
    console.log("Scroll Progress:", latest.toFixed(3))
    console.log("Active Step:", currentStepIndex)
  })

  return (
    // STEP 1 — CREATE TALL SCROLL CONTAINER
    <section 
      ref={containerRef} 
      id="how-it-works" 
      className="relative h-[300vh] bg-background"
    >
      {/* STEP 2 — PIN THE SECTION */}
      <motion.div 
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden"
      >
        {/* Visual Foundations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-radial-gradient from-sprout-500/10 to-transparent blur-3xl opacity-60" />
          <div className="absolute inset-0 grain-texture opacity-30" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12">
          
          <div className="mb-24 text-center">
            <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-sprout-400 drop-shadow-sm">
              Live System Visualization
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Operational <span className="gradient-text-sprout underline decoration-sprout-500/20 underline-offset-8">Pipeline</span>
            </h2>
          </div>

          <div className="relative flex flex-col md:flex-col gap-12">
            
            {/* TIMELINE LAYOUT - Horizontal Path (Desktop) */}
            <div className="hidden md:block relative h-20 w-full mb-8">
               
               {/* Timeline Base */}
               <div className="absolute top-1/2 left-0 w-full h-[4px] bg-white/10 rounded-full -translate-y-1/2 shadow-inner" />
               
               {/* STEP 4 & 5 — DYNAMIC PROGRESS BAR CONNECTED TO TRUCK */}
               <motion.div 
                 style={{ scaleX: smoothProgress }}
                 className="origin-left absolute top-1/2 left-0 w-full h-[4px] bg-gradient-to-r from-green-400 via-emerald-500 to-green-300 shadow-[0_0_15px_#22c55e] rounded-full -translate-y-1/2"
               />

               {/* STEP 8 — IMPROVE TIMELINE DESIGN (Nodes) */}
               <div className="absolute top-1/2 left-0 w-full flex justify-between -translate-y-1/2 pointer-events-none">
                  {steps.map((_, i) => (
                    <div key={i} className="relative z-0">
                      <div className="px-12"> 
                        <motion.div 
                          // Node activation state
                          animate={{
                            scale: i <= activeStep ? 1.5 : 1,
                            backgroundColor: i <= activeStep ? "#4ade80" : "#18181b",
                            borderColor: i <= activeStep ? "#22c55e" : "rgba(255,255,255,0.2)"
                          }}
                          transition={{ type: "spring", stiffness: 60, damping: 20 }}
                          className={cn(
                            "w-3 h-3 rounded-full border-2 transition-all duration-300 shadow-[0_0_10px_#22c55e]",
                            // Animated pulse on the active node
                            i === activeStep && "animate-pulse" 
                          )}
                        />
                      </div>
                    </div>
                  ))}
               </div>

               {/* STEP 2 — TRUCK MOVEMENT */}
               <motion.div 
                 style={{ left: truckPosition }} 
                 className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none"
               >
                  <div className="bg-sprout-500 p-2.5 rounded-xl shadow-[0_0_20px_#22c55e] border border-sprout-300/40 text-white relative">
                     <Truck size={24} />
                     
                     {/* STEP 10 — VISUAL QUALITY (Glow trails behind truck) */}
                     <div className="absolute top-1/2 -left-12 w-12 h-2 bg-gradient-to-r from-transparent to-sprout-400/50 blur-[3px] -translate-y-1/2 rounded-full" />
                  </div>
               </motion.div>
            </div>

            {/* TIMELINE LAYOUT - Vertical Stack (Mobile) */}
            <div className="block md:hidden absolute left-[30px] top-[140px] bottom-[40px] w-[4px]">
               <div className="absolute inset-0 w-full h-full bg-white/10 rounded-full" />
               
               {/* DYNAMIC VERTICAL BAR */}
               <motion.div 
                 style={{ scaleY: smoothProgress }}
                 className="origin-top absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-400 via-emerald-500 to-green-300 shadow-[0_0_15px_#22c55e] rounded-full"
               />

               {/* VERTICAL TRUCK */}
               <motion.div 
                 style={{ top: truckPosition }} 
                 className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
               >
                  <div className="bg-sprout-500 p-2 rounded-lg shadow-[0_0_20px_#22c55e] border border-white/20 text-white">
                     <Truck size={18} />
                  </div>
               </motion.div>
            </div>

            {/* STEP 5 — MANDATORY STEPS STRUCTURE */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 ml-16 md:ml-0 relative z-10">
               {steps.map((step, index) => {
                  const isActive = index === activeStep
                  const isPast = index <= activeStep

                  return (
                    // STEP 6 — PROGRESSIVE REVEAL
                    <motion.div
                      key={step.id}
                      animate={{
                        // STEP 7 — FIX HIGHLIGHTING (scale, glow, opacity)
                        scale: isActive ? 1.05 : 1.0,
                        y: isActive ? -10 : 0,
                        opacity: isPast ? 1 : 0.4,
                        filter: isPast ? "blur(0px)" : "blur(2px)",
                      }}
                      transition={{ type: "spring", stiffness: 60, damping: 20 }}
                      // STEP 1 — GLASSMORPHISM DESIGN (CRITICAL)
                      className={cn(
                        "relative flex flex-col h-full rounded-2xl border p-6 backdrop-blur-lg overflow-hidden transition-colors duration-500",
                        isActive 
                          ? "border-sprout-500/40 bg-white/10 shadow-[0_0_25px_rgba(34,197,94,0.5)] z-20" 
                          : "border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-10"
                      )}
                    >
                       {/* Layered Depth and Enhancements */}
                       {isActive && (
                         <div className="absolute inset-0 bg-gradient-to-br from-sprout-500/10 to-transparent pointer-events-none" />
                       )}

                       <div className="mb-6 relative h-12 w-12">
                          <div className={cn(
                            "relative z-10 flex h-full w-full items-center justify-center rounded-xl border transition-all duration-300",
                            isActive ? "bg-sprout-500/20 border-sprout-500/30 text-sprout-400" : "bg-white/10 border-white/10 text-white/50"
                          )}>
                             <step.icon size={26} strokeWidth={isActive ? 2 : 1.5} />
                          </div>
                       </div>

                       <div className="mt-auto relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                             <span className={cn(
                               "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-colors duration-300",
                               isActive ? "bg-sprout-500 text-black shadow-lg shadow-sprout-500/40" : "bg-white/10 text-white/50"
                             )}>
                                {index + 1}
                             </span>
                             <h3 className={cn(
                               "text-xl font-bold tracking-tight transition-colors duration-300",
                               isActive ? "text-white drop-shadow-md" : "text-white/60"
                             )}>
                                {step.title}
                             </h3>
                          </div>
                          <p className={cn(
                            "text-sm leading-relaxed transition-colors duration-300",
                            isActive ? "text-white/80" : "text-white/40"
                          )}>
                             {step.description}
                          </p>
                       </div>
                    </motion.div>
                  )
               })}
            </div>
          </div>
        </div>

        {/* STEP 12 — OPTIONAL UX ENHANCEMENT */}
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3], y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sprout-400/50">Scroll to Process</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-sprout-500/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  )
}
