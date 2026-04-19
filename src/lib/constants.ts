// ── Crop Types ──────────────────────────────────────────────────────────────
export const CROP_TYPES = [
  "sunflower",
  "pea-shoots",
  "radish",
  "wheatgrass",
  "mustard",
  "fenugreek",
] as const;

export type CropType = (typeof CROP_TYPES)[number];

// ── Crop Cycle Days ─────────────────────────────────────────────────────────
export const CROP_CYCLE_DAYS: Record<CropType, number> = {
  sunflower: 9,
  "pea-shoots": 8,
  radish: 7,
  wheatgrass: 10,
  mustard: 7,
  fenugreek: 8,
};

// ── Crop Prices (₹ per kg) ──────────────────────────────────────────────────
export const CROP_PRICE_PER_KG: Record<CropType, number> = {
  sunflower: 450,
  "pea-shoots": 380,
  radish: 320,
  wheatgrass: 400,
  mustard: 350,
  fenugreek: 360,
};

// ── Crop Display Names ──────────────────────────────────────────────────────
export const CROP_DISPLAY_NAMES: Record<CropType, string> = {
  sunflower: "Sunflower Shoots",
  "pea-shoots": "Pea Shoots",
  radish: "Radish",
  wheatgrass: "Wheat Grass",
  mustard: "Mustard",
  fenugreek: "Fenugreek",
};

// ── Production Constants ────────────────────────────────────────────────────
export const PAYOUT_PER_TRAY = 50; // ₹50 per accepted tray
export const TRAY_YIELD_GRAMS = 200; // 200g per tray
export const DEFAULT_BUFFER_PERCENT = 0.25; // 25% buffer

// ── Kit Options ─────────────────────────────────────────────────────────────
export const KIT_OPTIONS = [
  { name: "Starter", trays: 5, price: 0, description: "Perfect for beginners" },
  { name: "Standard", trays: 15, price: 999, description: "Most popular choice" },
  { name: "Pro", trays: 40, price: 2499, description: "For serious growers" },
] as const;

// ── Crop Growing Instructions ───────────────────────────────────────────────
export const CROP_INSTRUCTIONS: Record<string, Record<number, string>> = {
  sunflower: {
    1: "Spread seeds evenly on moistened cocopeat. Cover with another tray for darkness.",
    2: "Keep covered. Mist lightly if surface looks dry.",
    3: "Check germination. Seeds should show white sprouts. Upload photo.",
    4: "Remove cover tray. Expose to indirect light. Water 150ml.",
    5: "Water 150ml. Ensure good airflow.",
    6: "Check density and height. Upload photo for QC.",
    7: "Water 150ml.",
    8: "Pre-harvest check. Upload top + side photo.",
    9: "Harvest when 5-10cm tall. Cut at base, wash gently.",
  },
  "pea-shoots": {
    1: "Soak pea seeds for 8-12 hours. Spread on moistened medium. Cover.",
    2: "Keep covered. Mist if needed.",
    3: "Check germination progress. Upload photo.",
    4: "Remove cover. Expose to indirect light. Water 150ml.",
    5: "Water 150ml. Ensure tendrils are climbing.",
    6: "Check growth density. Upload photo.",
    7: "Pre-harvest check. Upload top + side photo.",
    8: "Harvest at 8-12cm. Cut above first leaf pair.",
  },
  radish: {
    1: "Spread radish seeds densely on moistened cocopeat. Cover tray.",
    2: "Keep covered. Mist lightly.",
    3: "Remove cover. Seeds should be sprouted. Water 100ml. Upload photo.",
    4: "Water 100ml. Ensure light exposure.",
    5: "Check density. Upload photo for QC.",
    6: "Pre-harvest check. Upload top + side photo.",
    7: "Harvest at 5-8cm. Cut at base.",
  },
  wheatgrass: {
    1: "Soak wheat berries for 8 hours. Spread on moistened soil. Cover.",
    2: "Keep covered. Mist if surface is dry.",
    3: "Check sprouting. Upload photo.",
    4: "Remove cover. Expose to light. Water 150ml.",
    5: "Water 150ml daily.",
    6: "Water 150ml. Grass should be 4-6 inches.",
    7: "Check color (should be vibrant green). Upload photo.",
    8: "Continue watering 150ml.",
    9: "Pre-harvest check. Upload top + side photo.",
    10: "Harvest at 6-8 inches. Cut just above soil line.",
  },
  mustard: {
    1: "Spread mustard seeds on moistened medium. Cover for darkness.",
    2: "Keep covered. Mist lightly.",
    3: "Remove cover. Sprouts visible. Water 100ml. Upload photo.",
    4: "Water 100ml. Ensure light.",
    5: "Check growth. Upload photo for QC.",
    6: "Pre-harvest check. Upload top + side photo.",
    7: "Harvest at 3-5cm. Cut at base.",
  },
  fenugreek: {
    1: "Soak fenugreek seeds for 6 hours. Spread on moistened medium. Cover.",
    2: "Keep covered. Mist if needed.",
    3: "Remove cover. Check sprouting. Upload photo.",
    4: "Water 100ml. Expose to light.",
    5: "Water 100ml daily.",
    6: "Check density and color. Upload photo.",
    7: "Pre-harvest check. Upload top + side photo.",
    8: "Harvest at 4-6cm. Cut at base.",
  },
};
