import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { toRole } from "@/lib/nav";
import { getShellData } from "@/lib/shell-data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = toRole((session.user as { role?: string }).role);
  const userName = session.user.name || "User";
  const shell = await getShellData(role, session.user.id);

  return (
    <AppShell role={role} userName={userName} shell={shell}>
      {children}
    </AppShell>
  );
}
