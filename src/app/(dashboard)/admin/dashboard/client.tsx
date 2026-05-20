"use client";

import { ScrollReveal } from "@/components/shared/ScrollReveal";

export function AdminDashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal direction="up" delay={0}>
      <div>{children}</div>
    </ScrollReveal>
  );
}
