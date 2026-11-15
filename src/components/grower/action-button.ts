import { cn } from "@/lib/utils";

// "solid" is the one filled button on a light panel; "onDark" sits on the dark
// "Today's tasks" card, where the colours swap (brand and brand-ink trade places).
export type ActionTone = "solid" | "onDark";

export function actionButtonClass(tone: ActionTone = "solid") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[opacity,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    tone === "solid"
      ? "bg-brand text-brand-ink hover:opacity-90 focus-visible:ring-brand/50"
      : "bg-brand-ink text-brand hover:opacity-90 focus-visible:ring-brand-ink/60"
  );
}
