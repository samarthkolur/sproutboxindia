"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { performSignOut } from "@/actions/auth.actions";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function SignOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await performSignOut();
  };

  return (
    <div>
      {/* Logo */}
      <BrandLogo className="mb-8" markClassName="h-10 w-10" textClassName="text-xl" />

      <h1 className="text-3xl font-black text-text-primary mb-1 tracking-tight">
        Sign Out
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Are you sure you want to sign out of your account?
      </p>

      <div className="space-y-4">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-red-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Yes, Sign Out
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={() => router.back()}
          disabled={loading}
          className="w-full bg-white/60 border border-white/50 text-text-primary py-3 rounded-xl text-sm font-semibold hover:bg-white/80 transition-all hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 backdrop-blur-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
