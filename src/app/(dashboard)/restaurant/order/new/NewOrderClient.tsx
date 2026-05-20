"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  CROP_DISPLAY_NAMES,
  CROP_PRICE_PER_KG,
  CROP_IMAGES,
  CROP_TYPES,
  CropType,
} from "@/lib/constants";
import { ShoppingCart, Calendar, Info, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  cropType: CropType;
  quantityKg: number;
}

export function NewOrderClient() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tomorrow's date + 10 days as the minimum delivery date
  const minDeliveryDate = new Date();
  minDeliveryDate.setDate(minDeliveryDate.getDate() + 9); // Needs at least 9 days for growing cycle
  const minDateStr = minDeliveryDate.toISOString().split("T")[0];

  const addToCart = (cropType: CropType) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.cropType === cropType);
      if (existing) {
        return prev.map((item) =>
          item.cropType === cropType
            ? { ...item, quantityKg: item.quantityKg + 0.5 }
            : item
        );
      }
      return [...prev, { cropType, quantityKg: 1 }];
    });
  };

  const updateQuantity = (cropType: CropType, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cropType === cropType) {
            const nextQty = Math.max(0, item.quantityKg + change);
            return { ...item, quantityKg: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantityKg > 0)
    );
  };

  const removeFromCart = (cropType: CropType) => {
    setCart((prev) => prev.filter((item) => item.cropType !== cropType));
  };

  const totalAmount = cart.reduce((sum, item) => {
    return sum + item.quantityKg * CROP_PRICE_PER_KG[item.cropType];
  }, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to your order.");
      return;
    }
    if (!deliveryDate) {
      setError("Please select a delivery date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create separate orders for each crop in the cart
      const promises = cart.map((item) =>
        fetch("/api/restaurant/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cropType: item.cropType,
            quantityKg: item.quantityKg,
            deliveryDate: new Date(deliveryDate),
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every((r) => r.ok);

      if (allOk) {
        router.push("/restaurant/orders");
        router.refresh();
      } else {
        setError("Failed to place one or more orders. Please try again.");
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Crop Catalog */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {CROP_TYPES.map((crop) => {
            const cartItem = cart.find((item) => item.cropType === crop);
            return (
              <GlassCard key={crop} className="overflow-hidden p-0 flex flex-col h-full group hover:shadow-sprout-800/10 hover:border-sprout-700/30 transition-all duration-300">
                {/* Product Image */}
                <div className="relative h-44 w-full overflow-hidden bg-sprout-50">
                  <img
                    src={CROP_IMAGES[crop]}
                    alt={CROP_DISPLAY_NAMES[crop]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-sprout-800 shadow-sm border border-white/40">
                    {crop === "wheatgrass" ? "10 days" : crop === "sunflower" ? "9 days" : "7-8 days"} grow
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-text-primary group-hover:text-sprout-800 transition-colors">
                        {CROP_DISPLAY_NAMES[crop]}
                      </h3>
                      <span className="text-lg font-black text-sprout-800">
                        ₹{CROP_PRICE_PER_KG[crop]}<span className="text-xs font-normal text-text-muted">/kg</span>
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mb-4">
                      Grown to order. Harvested fresh and delivered on your schedule.
                    </p>
                  </div>

                  {/* Action Button / Qty Selector */}
                  {cartItem ? (
                    <div className="flex items-center justify-between bg-sprout-50 border border-sprout-200/50 rounded-xl p-1.5">
                      <button
                        onClick={() => updateQuantity(crop, -0.5)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-sprout-100 text-sprout-800 shadow-sm active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-text-primary px-3">
                        {cartItem.quantityKg} kg
                      </span>
                      <button
                        onClick={() => updateQuantity(crop, 0.5)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-sprout-100 text-sprout-800 shadow-sm active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(crop)}
                      className="w-full bg-sprout-800 hover:bg-sprout-900 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-sprout-800/15"
                    >
                      <Plus className="w-4 h-4" /> Add to Order
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Cart Summary & Delivery Details */}
      <div className="space-y-6">
        <GlassCard className="sticky top-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-sprout-200/20">
            <ShoppingCart className="w-5 h-5 text-sprout-800" />
            <h2 className="text-lg font-bold text-text-primary">Order Cart</h2>
            {cart.length > 0 && (
              <span className="ml-auto bg-sprout-100 text-sprout-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 text-text-muted/40" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">Your cart is empty</p>
              <p className="text-xs text-text-muted max-w-[200px] mx-auto">
                Click &quot;Add to Order&quot; on any of the microgreens to build your plan.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart List */}
              <div className="divide-y divide-sprout-200/10 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.cropType} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {CROP_DISPLAY_NAMES[item.cropType]}
                      </h4>
                      <p className="text-xs text-text-muted">
                        {item.quantityKg} kg @ ₹{CROP_PRICE_PER_KG[item.cropType]}/kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">
                        ₹{item.quantityKg * CROP_PRICE_PER_KG[item.cropType]}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.cropType)}
                        className="text-text-muted/60 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="space-y-4 pt-4 border-t border-sprout-200/20">
                <label className="block">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
                    <Calendar className="w-4 h-4 text-sprout-800" />
                    Delivery Date
                  </div>
                  <input
                    type="date"
                    min={minDateStr}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full h-11 px-3 bg-white/70 border border-sprout-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sprout-700/20 focus:border-sprout-700/50 transition-all font-medium text-text-primary"
                  />
                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-text-muted bg-sprout-50/50 p-2.5 rounded-xl border border-sprout-100">
                    <Info className="w-4 h-4 text-sprout-700 flex-shrink-0 mt-0.5" />
                    <span>
                      Microgreens are grown to order. Sowing starts immediately, and delivery takes a minimum of 9-10 days.
                    </span>
                  </div>
                </label>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-sprout-200/20 space-y-4">
                <div className="flex items-center justify-between text-base">
                  <span className="font-bold text-text-secondary">Estimated Total</span>
                  <span className="text-xl font-black text-sprout-800">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full bg-sprout-800 hover:bg-sprout-900 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>Place Order & Start Growing</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
