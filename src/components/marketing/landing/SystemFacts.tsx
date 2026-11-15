import { StatTile } from "@/components/ui/stat-tile";
import { LANDING_FACTS } from "./facts";
import { SectionHeading } from "./SectionHeading";

const FACTS = [
  { label: "Microgreen Varieties", value: String(LANDING_FACTS.varieties), caption: "Sunflower to fenugreek" },
  {
    label: "Days to harvest",
    value: `${LANDING_FACTS.minDays}–${LANDING_FACTS.maxDays}`,
    caption: "From sowing to harvest, depending on the crop",
  },
  { label: "Production Buffer", value: `${LANDING_FACTS.bufferPercent}%`, caption: "Built into every plan" },
  { label: "Stage QC", value: String(LANDING_FACTS.qcStages), caption: "Digital, hub & delivery checks" },
  {
    label: "Per Tray Payout",
    value: `₹${LANDING_FACTS.payoutPerTray}`,
    caption: "For every tray that passes quality control",
  },
  { label: "Trays to Start", value: String(LANDING_FACTS.startTrays), caption: "Low barrier grower onboarding" },
];

export function SystemFacts() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The system"
          title="Built on a real system"
          subtitle="A demand engine and QC process, not just a pitch"
        />
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {FACTS.map((fact) => (
            <StatTile key={fact.label} label={fact.label} value={fact.value} caption={fact.caption} />
          ))}
        </div>
      </div>
    </section>
  );
}
