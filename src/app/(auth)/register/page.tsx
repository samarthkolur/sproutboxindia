"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { saveRegistrationPrefill } from "@/lib/registration-prefill";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "GROWER" as "GROWER" | "RESTAURANT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      saveRegistrationPrefill({
        role: formData.role,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (formData.role === "GROWER") {
        router.push("/join/grower");
      } else {
        router.push("/join/restaurant");
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
        Create your account
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Join SproutBox as a grower or restaurant partner
      </p>

      {error && (
        <div className="bg-status-error/10 border border-status-error/20 text-status-error rounded-xl px-4 py-3 mb-6 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role selection */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, role: "GROWER" }))
              }
              className={`p-4 rounded-xl border text-center transition-all group ${
                formData.role === "GROWER"
                  ? "border-sprout-600 bg-sprout-50/80 shadow-md shadow-sprout-800/10"
                  : "border-white/50 bg-white/40 hover:bg-white/60 hover:border-white/70"
              }`}
            >
              <span className="text-2xl mb-1.5 block group-hover:scale-110 transition-transform">🌱</span>
              <span className={`text-sm font-semibold ${formData.role === "GROWER" ? "text-sprout-800" : "text-text-secondary"}`}>
                Grower
              </span>
              <p className={`text-[10px] mt-0.5 ${formData.role === "GROWER" ? "text-sprout-600" : "text-text-muted"}`}>
                Grow from home
              </p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, role: "RESTAURANT" }))
              }
              className={`p-4 rounded-xl border text-center transition-all group ${
                formData.role === "RESTAURANT"
                  ? "border-sprout-600 bg-sprout-50/80 shadow-md shadow-sprout-800/10"
                  : "border-white/50 bg-white/40 hover:bg-white/60 hover:border-white/70"
              }`}
            >
              <span className="text-2xl mb-1.5 block group-hover:scale-110 transition-transform">🍽️</span>
              <span className={`text-sm font-semibold ${formData.role === "RESTAURANT" ? "text-sprout-800" : "text-text-secondary"}`}>
                Restaurant
              </span>
              <p className={`text-[10px] mt-0.5 ${formData.role === "RESTAURANT" ? "text-sprout-600" : "text-text-muted"}`}>
                Order fresh produce
              </p>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
              placeholder="Min. 6 chars"
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider"
            >
              Confirm
            </label>
            <input
              id="confirm-password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              className="w-full bg-white/60 border border-white/50 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-sprout-500 focus:ring-2 focus:ring-sprout-500/20 transition-all backdrop-blur-sm"
              placeholder="••••••••"
              required
            />
          </div>
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
              Continue
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
            Already have an account?
          </span>
        </div>
      </div>

      <Link
        href="/login"
        className="block w-full text-center border-2 border-sprout-800/15 text-sprout-800 py-3 rounded-xl text-sm font-semibold hover:bg-sprout-50/50 hover:border-sprout-800/30 transition-all active:scale-[0.98]"
      >
        Sign in instead
      </Link>
    </div>
  );
}
