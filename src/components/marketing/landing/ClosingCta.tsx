import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="panel mx-auto max-w-4xl px-6 py-12 text-center sm:px-12 sm:py-16">
        <h2 className="text-3xl font-light tracking-tight text-ink sm:text-4xl">Ready to grow with us?</h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
          Join the microgreen revolution — whether you grow or you order, we&apos;ve got you covered.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/join/grower">Join as Grower</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-hairline bg-panel/60">
            <Link href="/join/restaurant">Partner as Restaurant</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
