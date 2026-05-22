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
      <main className="min-w-0 lg:ml-[260px] w-full">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-[72px] sm:px-6 sm:pt-20 lg:pb-10 lg:pt-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
