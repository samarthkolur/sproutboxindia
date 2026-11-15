import Link from "next/link";
import { ArrowRight, ClipboardList, IndianRupee, Star, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatusChip } from "@/components/ui/status-chip";
import { FeatureList } from "./FeatureList";
import { LANDING_FACTS } from "./facts";
import { SectionHeading } from "./SectionHeading";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Day-by-day instructions",
    description: "Guided growing process for every tray, every crop",
  },
  {
    icon: IndianRupee,
    title: `Earn ₹${LANDING_FACTS.payoutPerTray}+ per tray`,
    description: "Consistent income from home, on your schedule",
  },
  {
    icon: Star,
    title: "Performance scoring",
    description: "Build reputation with yield, quality, and timeliness metrics",
  },
  {
    icon: Target,
    title: `Start with ${LANDING_FACTS.startTrays} trays`,
    description: "Low barrier to entry, scale up as you grow",
  },
];

const SAMPLE_TRAYS = [
  { crop: "Sunflower", trays: "5 trays", status: "GROWING" },
  { crop: "Pea Shoots", trays: "3 trays", status: "SOWING" },
  { crop: "Radish", trays: "2 trays", status: "HARVEST_READY" },
];

export function ForGrowers() {
  return (
    <section id="growers" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="For Growers" title="Turn your space into a micro-farm" align="left" />
          <div className="mt-8">
            <FeatureList items={FEATURES} />
          </div>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link href="/join/grower">
              Start Growing
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <figure>
          <Panel padding="lg" aria-label="Sample grower task">
            <div className="flex items-center gap-4">
              <Ring percent={(4 / 9) * 100} size={84} strokeWidth={7} label="Day 4 of 9">
                <span className="text-xl font-light text-ink">4/9</span>
              </Ring>
              <div className="min-w-0">
                <p className="text-sm text-ink-muted">Sunflower Shoots</p>
                <p className="mt-0.5 text-base font-semibold text-ink">Day 4 of 9</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-inset/70 p-4">
              <p className="text-sm font-medium text-ink">Remove cover, expose to light</p>
              <p className="mt-1 text-sm text-ink-soft">Water 150ml. Ensure good airflow around trays.</p>
            </div>
            <ul className="mt-5 divide-y divide-hairline/60">
              {SAMPLE_TRAYS.map((tray) => (
                <li key={tray.crop} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{tray.crop}</p>
                    <p className="text-micro text-ink-muted">{tray.trays}</p>
                  </div>
                  <StatusChip status={tray.status} />
                </li>
              ))}
            </ul>
          </Panel>
          <figcaption className="mt-3 text-center text-micro text-ink-muted">Sample dashboard — illustrative preview</figcaption>
        </figure>
      </div>
    </section>
  );
}
