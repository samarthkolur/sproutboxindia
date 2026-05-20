import { ClipboardList, Route, Truck } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const steps = [
  { title: "Restaurant places order", description: "Demand is captured by crop, quantity, and delivery date.", icon: ClipboardList },
  { title: "Engine distributes trays", description: "Production plans add buffer and allocate work by grower score.", icon: Route },
  { title: "Fresh produce delivered", description: "QC-approved harvests move through hubs to restaurant doors.", icon: Truck },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black text-text-primary">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <GlassCard key={step.title}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sprout-100 text-sprout-800">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-sprout-700">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-bold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{step.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
