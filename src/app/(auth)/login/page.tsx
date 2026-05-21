"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
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
      {/* Logo */}
      <BrandLogo className="mb-8" markClassName="h-10 w-10" textClassName="text-xl" />

      <h1 className="text-3xl font-black text-text-primary mb-1 tracking-tight">
        Welcome back
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Sign in to your account to continue
      </p>

      {error && (
        <div className="bg-status-error/10 border border-status-error/20 text-status-error rounded-xl px-4 py-3 mb-6 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sprout-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/25 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/40" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-transparent px-4 text-xs text-text-muted">
            New to SproutBox?
          </span>
        </div>
      </div>

      <Link
        href="/register"
        className="block w-full text-center border-2 border-sprout-800/15 text-sprout-800 py-3 rounded-xl text-sm font-semibold hover:bg-sprout-50/50 hover:border-sprout-800/30 transition-all active:scale-[0.98]"
      >
        Create an account
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-muted py-10">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
