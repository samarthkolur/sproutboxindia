import { GlassCard } from "@/components/shared/GlassCard";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <GlassCard>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">About SproutBox</h1>
        <p className="mt-4 text-text-secondary">
          SproutBox is a demand-driven operating system for decentralized microgreen production:
          restaurants place orders, admins convert demand into tray plans, growers execute guided
          tasks, and QC keeps every delivery consistent.
        </p>
      </GlassCard>
    </main>
  );
}
