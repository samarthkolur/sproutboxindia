import { GlassCard } from "@/components/shared/GlassCard";
import { BookOpen, Droplets, Sun, Moon, Scissors } from "lucide-react";

export default function TutorialPage() {
  const steps = [
    {
      title: "Preparation & Sowing",
      icon: <Droplets className="w-6 h-6 text-blue-500" />,
      color: "bg-blue-100",
      description: "Get your tray ready and plant the seeds.",
      details: [
        "Soak larger seeds (like sunflower or pea shoots) in water for 8-12 hours before planting.",
        "Moisten the provided coco coir or growing mat with water until it's damp, but not dripping.",
        "Spread the seeds evenly across the surface. Do not bury them.",
        "Mist the seeds generously with your spray bottle.",
      ],
    },
    {
      title: "The Blackout Phase (Days 1-3)",
      icon: <Moon className="w-6 h-6 text-slate-500" />,
      color: "bg-slate-200",
      description: "Simulate being underground so the seeds sprout strongly.",
      details: [
        "Place an empty tray or cover over the seeds to block out all light.",
        "Keep them in a warm area (around 20-24°C).",
        "Check once daily and give them a light misting to ensure they remain moist.",
        "You will see them sprout and grow yellow/white stems. This is normal!",
      ],
    },
    {
      title: "The Light Phase (Days 4-7)",
      icon: <Sun className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-100",
      description: "Expose them to light to turn them green and nutritious.",
      details: [
        "Once the sprouts are pushing the cover up (about 1-2 inches tall), remove the blackout cover.",
        "Place the tray in a well-lit area, avoiding harsh direct afternoon sunlight.",
        "Start bottom-watering: pour water into the bottom tray rather than misting from above to prevent mold.",
        "Watch them turn vibrant green over the next couple of days!",
      ],
    },
    {
      title: "Harvesting (Day 7-10)",
      icon: <Scissors className="w-6 h-6 text-sprout-600" />,
      color: "bg-sprout-100",
      description: "Reaping the rewards of your urban farm.",
      details: [
        "Once they develop their first set of true leaves (or reach 3-4 inches), they are ready.",
        "Click 'Request Pickup' in your SproutBox dashboard.",
        "Using clean scissors or a sharp knife, cut the microgreens just above the soil/mat line.",
        "Do not wash them before packing, as excess moisture reduces shelf life. The restaurant will wash them before serving.",
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sprout-100 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-sprout-700" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Grower Tutorial
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">
            Learn how to use your SproutBox kit to grow premium microgreens
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <GlassCard key={index} className="overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-sprout-500 opacity-20" />
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center ${step.color}`}>
                {step.icon}
              </div>
              <div>
                <h3 className="flex flex-wrap items-center gap-1 sm:gap-2 text-lg sm:text-xl font-bold text-text-primary">
                  <span>{`Step ${index + 1}`}</span>
                  <span>: </span>
                  <span>{step.title}</span>
                </h3>
                <p className="text-sm text-text-secondary mt-1 mb-4">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-primary leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-sprout-400 mt-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        ))}

        <GlassCard className="bg-sprout-50/50 border-sprout-200">
          <h3 className="text-lg font-bold text-sprout-800 mb-2">Pro Tips for Success</h3>
          <ul className="grid gap-3 sm:gap-4 min-[480px]:grid-cols-2">
            <li className="bg-white/60 p-3 rounded-lg border border-sprout-100 text-sm text-text-primary">
              <span className="font-semibold block mb-1">Ventilation is key</span>
              Ensure there is decent airflow in the room to prevent mold growth on the dense root mats.
            </li>
            <li className="bg-white/60 p-3 rounded-lg border border-sprout-100 text-sm text-text-primary">
              <span className="font-semibold block mb-1">Don&apos;t overwater</span>
              The soil/mat should be moist like a wrung-out sponge, never sitting in a puddle of water.
            </li>
            <li className="bg-white/60 p-3 rounded-lg border border-sprout-100 text-sm text-text-primary">
              <span className="font-semibold block mb-1">Daily Check-ins</span>
              Use the Check-In button on your tasks daily. It helps us monitor quality and triggers payouts!
            </li>
            <li className="bg-white/60 p-3 rounded-lg border border-sprout-100 text-sm text-text-primary">
              <span className="font-semibold block mb-1">Need Supplies?</span>
              If you run out of coco peat or seeds, contact the Admin hub. New supplies are dispatched automatically with new tasks.
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
