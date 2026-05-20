import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="lg:ml-[260px]">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
