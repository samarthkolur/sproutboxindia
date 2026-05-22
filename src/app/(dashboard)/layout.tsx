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
      {/* Blobs — hidden on small screens to reduce clutter */}
      <div className="blob blob-animated w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-sprout-100/40 -top-20 right-0 fixed hidden sm:block" />
      <div className="blob blob-animated-alt w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-sprout-200/30 bottom-0 left-1/2 fixed hidden sm:block" />

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

      {/* Main content — extra top padding on mobile for hamburger clearance */}
      <main className="relative z-10 min-w-0 flex-1 w-full lg:ml-[260px]">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-[72px] sm:px-6 sm:pt-20 lg:pb-10 lg:pt-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
