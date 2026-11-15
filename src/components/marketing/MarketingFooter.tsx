import Link from "next/link";
import { Sprout } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MARKETING_LINKS } from "./MarketingNav";

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign In" },
  { href: "/register", label: "Create Account" },
  { href: "/join/grower", label: "Join as Grower" },
  { href: "/join/restaurant", label: "Partner as Restaurant" },
] as const;

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="px-3 pb-3 pt-16 sm:px-4">
      <div className="panel mx-auto max-w-6xl p-6 sm:p-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <BrandLogo className="mb-3" />
            <p className="max-w-xs text-sm text-ink-soft">
              Demand-driven, decentralized microgreen production and supply platform.
            </p>
          </div>
          <FooterColumn title="Platform" links={MARKETING_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-hairline/70 pt-5 text-micro text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{`© ${new Date().getFullYear()} SproutBox. All rights reserved.`}</p>
          <p className="inline-flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
            Made in India
          </p>
        </div>
      </div>
    </footer>
  );
}
