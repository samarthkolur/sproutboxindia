import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid bg-grid-fade" />

      {/* Animated blobs */}
      <div className="blob blob-animated w-[600px] h-[600px] bg-sprout-200/60 -top-40 -left-40" />
      <div className="blob blob-animated-alt w-[500px] h-[500px] bg-sprout-300/40 bottom-0 right-0" />
      <div className="blob blob-animated w-[350px] h-[350px] bg-sprout-100/70 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="blob w-[200px] h-[200px] bg-sprout-400/20 top-20 right-20" />

      {/* Dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-30" />

      {/* Glass card */}
      <div className="glass-strong p-8 sm:p-10 w-full max-w-[460px] mx-4 relative z-10 glow-green">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[24px]" />
        <div className="relative z-10">{children}</div>
      </div>

      {/* Bottom link back to home */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Link
          href="/"
          className="text-xs text-text-muted hover:text-sprout-800 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to SproutBox
        </Link>
      </div>
    </div>
  );
}
