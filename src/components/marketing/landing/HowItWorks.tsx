import { Package, Sprout, Truck } from "lucide-react";
import { LANDING_FACTS } from "./facts";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    icon: Package,
    title: "Restaurant Orders",
    description: "Choose from our microgreen varieties. Set quantities and a delivery date, all through a clear catalog.",
  },
  {
    icon: Sprout,
    title: "Smart Distribution",
    description:
      "Our demand engine converts orders to tray tasks and allocates them to top-rated growers using a score-weighted algorithm.",
  },
  {
    icon: Truck,
    title: "Quality Delivered",
    description:
      "Every harvest is QC-checked with digital + physical inspection. Aggregated at local hubs and delivered fresh to your kitchen.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Process"
          title="Three steps to fresh delivery"
          subtitle={`From restaurant order to doorstep in ${LANDING_FACTS.minDays}–${LANDING_FACTS.maxDays} days`}
        />

        {/* A real sequence, so the steps are numbered and joined by a line. */}
        <ol className="relative mt-12 grid gap-8 md:grid-cols-3">
          <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-6 hidden h-px bg-hairline md:block" />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative flex gap-4 md:block md:text-center">
                {index < STEPS.length - 1 && (
                  <span aria-hidden="true" className="absolute left-6 top-14 h-[calc(100%+0.5rem)] w-px bg-hairline md:hidden" />
                )}
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink md:mx-auto">
                  {`0${index + 1}`}
                </span>
                <div className="min-w-0 pb-2 md:mt-5">
                  <Icon className="mb-3 hidden h-6 w-6 text-leaf md:mx-auto md:block" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
