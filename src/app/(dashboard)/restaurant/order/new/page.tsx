import { GlassCard } from "@/components/shared/GlassCard";
import { CROP_TYPES, CROP_DISPLAY_NAMES, CROP_PRICE_PER_KG } from "@/lib/constants";
import { ShoppingCart, Leaf, ArrowRight } from "lucide-react";

export default function NewOrderPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">New Order</h1>
        <p className="text-text-secondary mt-1">Select microgreens and place your order</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CROP_TYPES.map((crop) => (
          <GlassCard key={crop} hover>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-sprout-100 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-sprout-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{CROP_DISPLAY_NAMES[crop]}</h3>
                <p className="text-lg font-black text-sprout-800">₹{CROP_PRICE_PER_KG[crop]}/kg</p>
              </div>
            </div>
            <button className="w-full bg-sprout-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Add to Order <ShoppingCart className="w-4 h-4" />
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="text-center py-10">
          <ShoppingCart className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Your cart is empty</h3>
          <p className="text-sm text-text-muted">Select crops above to start building your order</p>
        </div>
      </GlassCard>
    </div>
  );
}
