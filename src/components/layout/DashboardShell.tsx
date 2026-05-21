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
      <main className="min-w-0 lg:ml-[260px]">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
