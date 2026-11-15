// Plain module on purpose: the nav is a client component but the footer is a
// server component, and a server component cannot read data exported from a
// "use client" file. Keep both reading from here.
//
// Anchors use "/#id" so they also work from /about and the join pages.
export const MARKETING_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#growers", label: "For Growers" },
  { href: "/#restaurants", label: "For Restaurants" },
  { href: "/about", label: "About" },
] as const;
