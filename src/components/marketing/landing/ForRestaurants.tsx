import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPinned, ShieldCheck, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  CROP_CYCLE_DAYS,
  CROP_DISPLAY_NAMES,
  CROP_IMAGES,
  CROP_PRICE_PER_KG,
  CROP_TYPES,
} from "@/lib/constants";
import { FeatureList } from "./FeatureList";
import { LANDING_FACTS } from "./facts";
import { SectionHeading } from "./SectionHeading";

const FEATURES = [
  {
    icon: ShoppingBasket,
    title: `${LANDING_FACTS.varieties} varieties, transparent pricing`,
    description: "Per-kg pricing with no hidden costs",
  },
  {
    icon: MapPinned,
    title: "Real-time order tracking",
    description: "Track from sowing to delivery on your dashboard",
  },
  {
    icon: CalendarClock,
    title: "Weekly or biweekly rhythm",
    description: "Tell us how often you need greens, then place each order in a few taps.",
  },
  {
    icon: ShieldCheck,
    title: "Quality checked",
    description: "Multi-stage QC at field, hub, and delivery",
  },
];

export function ForRestaurants() {
  return (
    <section id="restaurants" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* The catalog is the real one: same prices, photos and grow times as the order page. */}
        <Panel padding="lg" className="order-2 lg:order-1" aria-label="Crop catalog">
          <PanelHeader title="Crop Catalog" />
          <ul className="grid gap-2.5">
            {CROP_TYPES.map((crop) => (
              <li key={crop} className="flex items-center gap-3 rounded-2xl bg-inset/70 p-2.5">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <Image src={CROP_IMAGES[crop]} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{CROP_DISPLAY_NAMES[crop]}</p>
                  <p className="text-micro text-ink-muted">{`${CROP_CYCLE_DAYS[crop]} days`}</p>
                </div>
                <p className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-ink">{`₹${CROP_PRICE_PER_KG[crop]}/kg`}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="order-1 lg:order-2">
          <SectionHeading eyebrow="For Restaurants" title="The freshest microgreens, on schedule" align="left" />
          <div className="mt-8">
            <FeatureList items={FEATURES} />
          </div>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link href="/join/restaurant">
              Partner With Us
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
