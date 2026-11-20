import { ExperimentProvider } from "@/components/experiments/ExperimentProvider";
import { getExperimentContext } from "@/lib/experiments/server";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Variants are picked on the server so the first HTML already shows the
  // right one (no flicker). See src/lib/experiments/config.ts.
  const { assignments, trackable } = getExperimentContext();

  return (
    <ExperimentProvider assignments={assignments} trackable={trackable}>
      <div className="min-h-screen flex flex-col">
        {/* Navbar will be added in Phase 2 */}
        <main className="flex-1">{children}</main>
        {/* Footer will be added in Phase 2 */}
      </div>
    </ExperimentProvider>
  );
}
