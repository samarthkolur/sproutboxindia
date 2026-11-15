import Image from "next/image";
import { CROP_CYCLE_DAYS, CROP_DISPLAY_NAMES, CROP_IMAGES, CROP_TYPES, type CropType } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Timeline } from "@/components/ui/timeline";
import { dayPlan } from "@/lib/grower";

// General habits that hold for every crop. The crop-specific steps come from CROP_INSTRUCTIONS,
// the same text a grower sees on their tasks, so this page never disagrees with the app.
const TIPS = [
  {
    title: "Keep the covered days dark",
    body: "While the seeds are covered, lift the cover only for the day's check. Light too early gives pale, weak stems.",
  },
  {
    title: "Water gently and evenly",
    body: "Use the amount in the day's step. Leaves that stay wet invite mould, so water the base rather than soaking the tops.",
  },
  {
    title: "Give light and air",
    body: "Indirect light and a little airflow keep stems sturdy and green. Avoid harsh afternoon sun.",
  },
  {
    title: "Take photos that pass QC",
    body: "Take the top and side photos in daylight, from the same distance every day, so the reviewer can compare them.",
  },
  {
    title: "Request pickup on time",
    body: "When the cycle is complete, the Request Pickup button appears on your task. Harvesting by the due date counts towards your timing score.",
  },
];

function parseCrop(value: string | undefined): CropType {
  return (CROP_TYPES as readonly string[]).includes(value ?? "") ? (value as CropType) : "sunflower";
}

export default function TutorialPage({ searchParams }: { searchParams: { crop?: string } }) {
  const crop = parseCrop(searchParams.crop);
  const days = CROP_CYCLE_DAYS[crop];
  const plan = dayPlan(crop, 0, false);

  return (
    <>
      <PageHeader title="How to grow" subtitle="Pick a crop to see what to do on each day, from sowing to harvest." />

      <FilterChips
        ariaLabel="Choose a crop"
        value={crop}
        hrefFor={(value) => `/grower/tutorial?crop=${value}`}
        chips={CROP_TYPES.map((value) => ({ value, label: CROP_DISPLAY_NAMES[value] }))}
        className="mb-5"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-5">
        <Panel padding="none" className="overflow-hidden">
          <div className="relative h-40 bg-inset sm:h-48">
            <Image src={CROP_IMAGES[crop]} alt={CROP_DISPLAY_NAMES[crop]} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          </div>
          <div className="p-4 sm:p-5">
            <PanelHeader title={CROP_DISPLAY_NAMES[crop]} subtitle={`${days} days from sowing to harvest`} />
            <Timeline
              items={plan.map((step) => ({
                key: String(step.day),
                title: `Day ${step.day}`,
                description: step.instruction,
                state: "step" as const,
              }))}
            />
          </div>
        </Panel>

        <Panel className="self-start">
          <PanelHeader title="Pro tips" subtitle="Good habits for every crop" />
          <div className="divide-y divide-hairline/70">
            {TIPS.map((tip) => (
              <details key={tip.title} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 [&::-webkit-details-marker]:hidden">
                  {tip.title}
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-sm text-ink-soft">{tip.body}</p>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
