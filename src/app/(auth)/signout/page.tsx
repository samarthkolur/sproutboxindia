"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { performSignOut } from "@/actions/auth.actions";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await performSignOut();
  };

  // Opened in a new tab there is nothing to go back to, so fall back to the dashboard.
  const handleCancel = () => {
    if (window.history.length > 1) router.back();
    else router.push("/dashboard");
  };

  return (
    <div>
      <BrandLogo className="mb-8" markClassName="h-10 w-10" textClassName="text-xl" />

      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-ink">Sign Out</h1>
      <p className="mb-8 text-sm text-ink-soft">Are you sure you want to sign out of your account?</p>

      <div className="space-y-3">
        {/* V1: one solid action. Signing out is routine, so it is not red. */}
        <Button type="button" size="lg" onClick={handleSignOut} disabled={loading} className="w-full rounded-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Signing out…
            </>
          ) : (
            "Yes, Sign Out"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleCancel}
          disabled={loading}
          className="w-full rounded-full border-hairline bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
