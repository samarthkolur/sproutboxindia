import { CROP_INSTRUCTIONS } from "@/lib/constants";
import type { GrowthStage } from "@/lib/plant-growth";

const sunflower = CROP_INSTRUCTIONS.sunflower;

// Words for each stage of the growth story. The instructions are the real ones a
// grower sees for sunflower shoots, so the page never says anything the app does not.
export const STAGE_COPY: Record<GrowthStage["id"], { kicker: string; title: string; body: string; detail?: string }> = {
  sow: {
    kicker: "Now onboarding growers & restaurants",
    title: "Farm-to-fork, door to door.",
    body: "A demand-driven, decentralized microgreen network — connecting restaurants with home-based growers for the freshest produce, delivered on schedule.",
  },
  blackout: {
    kicker: "Days 1–3",
    title: "Sown in the dark",
    body: sunflower[1],
    detail: sunflower[3],
  },
  light: {
    kicker: "Day 4",
    title: "Into the light",
    body: sunflower[4],
  },
  grow: {
    kicker: "Days 5–8",
    title: "Growing strong",
    body: "Every day has a task, and growth checks come with a photo for quality control.",
    detail: sunflower[6],
  },
  harvest: {
    kicker: "Day 9",
    title: "Ready to harvest",
    body: sunflower[9],
    detail: "Then it is quality checked and delivered fresh to a restaurant kitchen.",
  },
};
