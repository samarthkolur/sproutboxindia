import { Leaf } from "lucide-react";
import { CROP_DISPLAY_NAMES, CROP_PRICE_PER_KG, CROP_TYPES } from "@/lib/constants";
import { GlassCard } from "@/components/shared/GlassCard";

export function CropCatalog() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CROP_TYPES.map((crop) => (
        <GlassCard key={crop}>
          <Leaf className="h-6 w-6 text-sprout-700" />
          <h3 className="mt-3 font-bold text-text-primary">{CROP_DISPLAY_NAMES[crop]}</h3>
          <p className="text-sm text-text-muted">₹{CROP_PRICE_PER_KG[crop]}/kg · {crop === "wheatgrass" ? 10 : 7} to 9 days</p>
        </GlassCard>
      ))}
    </div>
  );
}
