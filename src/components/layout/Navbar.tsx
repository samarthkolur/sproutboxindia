import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-black text-text-primary">
          <BrandLogo />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex">
          <Link href="/#how">How it works</Link>
          <Link href="/join/grower">For Growers</Link>
          <Link href="/join/restaurant">For Restaurants</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-sprout-800">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-sprout-800 text-white hover:bg-sprout-900">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
