import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ScrollProgress } from "./scroll-progress";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any).role || "GROWER";
  const userName = session.user.name || "User";

  return (
    <div className="relative flex min-h-screen overflow-x-hidden">
      {/* Scroll progress indicator */}
      <ScrollProgress />

      {/* Background layers */}
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 50% 50% at 80% 20%, rgba(82, 183, 136, 0.06), transparent)"
      }} />
      <div className="blob blob-animated w-[400px] h-[400px] bg-sprout-100/40 -top-20 right-0 fixed" />
      <div className="blob blob-animated-alt w-[300px] h-[300px] bg-sprout-200/30 bottom-0 left-1/2 fixed" />

      {/* Sidebar */}
      <Sidebar userName={userName} userRole={userRole} />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          classNames: {
            toast: "!rounded-xl !border !border-white/40 !shadow-xl",
            title: "!font-semibold",
          },
        }}
      />

      {/* Main content */}
      <main className="relative z-10 min-w-0 flex-1 lg:ml-[260px]">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
