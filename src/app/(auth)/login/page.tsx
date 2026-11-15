"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { safeCallbackUrl } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const justRegistered = searchParams.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        setError("Email or password is incorrect. Check them and try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BrandLogo className="mb-8" markClassName="h-10 w-10" textClassName="text-xl" />

      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mb-8 text-sm text-ink-soft">Sign in to your account to continue</p>

      {justRegistered && !error && (
        <div role="status" className="mb-6 flex items-start gap-2.5 rounded-tile bg-good-soft px-4 py-3 text-sm text-good">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Account created. Sign in to continue.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-tile bg-risk-soft px-4 py-3 text-sm text-risk">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          revealable
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="my-8 flex items-center gap-4 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-hairline" />
        <span>New to SproutBox?</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-full border-hairline bg-transparent">
        <Link href="/register">Create an account</Link>
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div role="status" className="py-10 text-center text-ink-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
