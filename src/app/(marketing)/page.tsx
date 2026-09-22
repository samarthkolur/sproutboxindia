"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

// ── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    // Observe the element and all children with reveal classes
    const revealElements = el.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale"
    );
    revealElements.forEach((child) => observer.observe(child));
    if (el.classList.contains("reveal") || el.classList.contains("reveal-left") || el.classList.contains("reveal-right") || el.classList.contains("reveal-scale")) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

// ── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ── Scroll Progress Bar ─────────────────────────────────────────────────────
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / totalHeight) * 100;
      setProgress(scrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="progress-line" style={{ width: `${progress}%` }} />;
}

// ── Mouse Glow Effect ───────────────────────────────────────────────────────
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(82, 183, 136, 0.06), transparent 40%)`;
      }
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-30 transition-all duration-300"
    />
  );
}

// ── Floating Navbar ─────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`nav-glass fixed top-0 left-0 right-0 z-50 ${scrolled ? "scrolled" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="group">
            <BrandLogo />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-sprout-800 transition-colors">
              How it works
            </a>
            <a href="#growers" className="text-sm text-text-secondary hover:text-sprout-800 transition-colors">
              For Growers
            </a>
            <a href="#restaurants" className="text-sm text-text-secondary hover:text-sprout-800 transition-colors">
              For Restaurants
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-sprout-800 transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-sprout-800 text-white px-4 py-2 rounded-xl hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/20 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const section1 = useScrollReveal();
  const section2 = useScrollReveal();
  const section3 = useScrollReveal();
  const section4 = useScrollReveal();
  const section5 = useScrollReveal();
  const section6 = useScrollReveal();
  const previewBars = [
    { day: "Mon", height: 42, opacity: 0.75 },
    { day: "Tue", height: 58, opacity: 0.82 },
    { day: "Wed", height: 74, opacity: 0.95 },
    { day: "Thu", height: 66, opacity: 0.88 },
    { day: "Fri", height: 80, opacity: 1 },
    { day: "Sat", height: 52, opacity: 0.78 },
    { day: "Sun", height: 70, opacity: 0.9 },
  ];

  return (
    <>
      <ScrollProgress />
      <MouseGlow />
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:pt-28">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid bg-grid-fade" />

        {/* Animated blobs */}
        <div className="blob blob-animated w-[600px] h-[600px] bg-sprout-200/70 -top-40 -left-40" />
        <div className="blob blob-animated-alt w-[500px] h-[500px] bg-sprout-300/50 bottom-0 right-0" />
        <div className="blob blob-animated w-[400px] h-[400px] bg-sprout-100/80 top-1/3 right-1/4" />
        <div className="blob w-[200px] h-[200px] bg-sprout-400/20 top-20 right-20" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 glass-card animate-in fade-in slide-in-from-bottom-4 duration-700 sm:mb-10"
          >
            <div className="w-2 h-2 bg-sprout-600 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-sprout-800 uppercase tracking-wider">
              Now onboarding growers &amp; restaurants
            </span>
          </div>

          {/* Main headline */}
          <h1 className="mb-5 text-4xl font-black leading-[1.02] tracking-tight text-text-primary animate-in fade-in slide-in-from-bottom-6 duration-1000 min-[380px]:text-5xl sm:mb-6 sm:text-6xl md:text-7xl lg:text-8xl lg:leading-[0.95]">
            Farm-to-fork,
            <br />
            <span className="gradient-text-animated">door to door.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-text-secondary animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 sm:mb-10 sm:text-xl">
            A demand-driven, decentralized microgreen network — connecting
            restaurants with home-based growers for the freshest produce,
            delivered on schedule.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link
              href="/join/grower"
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sprout-800 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-sprout-900 hover:shadow-xl hover:shadow-sprout-800/25 active:scale-[0.98] sm:w-auto sm:px-8"
            >
              <span>Join as Grower</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/join/restaurant"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-sprout-800/20 px-6 py-3.5 text-base font-semibold text-sprout-800 transition-all hover:border-sprout-800/40 hover:bg-sprout-50 active:scale-[0.98] sm:w-auto sm:px-8"
            >
              Partner as Restaurant
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 sm:mt-16">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
              Sample dashboard — illustrative preview
            </p>
            <div className="glass-strong mx-auto max-w-3xl p-4 glow-green sm:p-8">
              <div className="mb-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  { label: "Active Trays", value: "127", change: "+12%" },
                  { label: "QC Pass Rate", value: "94%", change: "+3%" },
                  { label: "Revenue MTD", value: "₹48.5K", change: "+18%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/60 bg-white/50 p-3 sm:p-4"
                  >
                    <p className="text-xs text-text-muted font-medium mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-text-primary">
                      {stat.value}
                    </p>
                    <span className="text-xs font-semibold text-sprout-600">
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 sm:gap-3">
                {previewBars.map((bar) => (
                  <div key={bar.day} className="flex-1">
                    <div
                      className="bg-gradient-to-t from-sprout-600 to-sprout-400 rounded-md"
                      style={{
                        height: `${bar.height}px`,
                        opacity: bar.opacity,
                      }}
                    />
                    <p className="text-[10px] text-text-muted text-center mt-1">
                      {bar.day}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow underneath */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-sprout-400/20 blur-3xl rounded-full" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 animate-bounce sm:flex">
          <span className="text-xs text-text-muted font-medium">Scroll</span>
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS MARQUEE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 border-y border-sprout-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-sprout-50/30" />
        <div className="flex whitespace-nowrap relative">
          <div className="marquee flex items-center gap-12 px-6">
            {[
              { value: 6, suffix: "", label: "Microgreen Varieties" },
              { value: 7, suffix: "-10", label: "Day Grow Cycles" },
              { value: 25, suffix: "%", label: "Production Buffer" },
              { value: 3, suffix: "", label: "Stage Quality Checks" },
              { value: 50, suffix: "₹+", label: "Per Tray Payout" },
              { value: 5, suffix: "", label: "Trays to Start Growing" },
              { value: 6, suffix: "", label: "Microgreen Varieties" },
              { value: 7, suffix: "-10", label: "Day Grow Cycles" },
              { value: 25, suffix: "%", label: "Production Buffer" },
              { value: 3, suffix: "", label: "Stage Quality Checks" },
              { value: 50, suffix: "₹+", label: "Per Tray Payout" },
              { value: 5, suffix: "", label: "Trays to Start Growing" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl font-black text-sprout-800">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm text-text-muted font-medium">
                  {stat.label}
                </span>
                {i < 11 && (
                  <div className="w-1.5 h-1.5 bg-sprout-400 rounded-full ml-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — Interactive Steps
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative px-4 py-20 sm:py-24 lg:py-32" ref={section1}>
        <div className="absolute inset-0 bg-dots opacity-40" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="reveal mb-12 text-center sm:mb-20">
            <span className="inline-block text-xs font-bold text-sprout-600 uppercase tracking-[0.2em] mb-4">
              The Process
            </span>
            <h2 className="text-3xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Three steps to{" "}
              <span className="gradient-text">fresh delivery</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary sm:text-lg">
              From restaurant order to doorstep in 7–10 days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                icon: "📦",
                title: "Restaurant Orders",
                description:
                  "Choose from 6 microgreen varieties. Set quantities, delivery schedule, and recurring preferences — all through a beautiful catalog.",
                color: "from-sprout-600/10 to-sprout-500/5",
              },
              {
                step: "02",
                icon: "🌱",
                title: "Smart Distribution",
                description:
                  "Our demand engine converts orders to tray tasks and allocates them to top-rated growers using a score-weighted algorithm.",
                color: "from-sprout-500/10 to-sprout-400/5",
              },
              {
                step: "03",
                icon: "🚀",
                title: "Quality Delivered",
                description:
                  "Every harvest is QC-checked with digital + physical inspection. Aggregated at local hubs and delivered fresh to your kitchen.",
                color: "from-sprout-400/10 to-sprout-300/5",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="reveal glass-card relative p-5 group sm:p-8"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Inner shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="select-none text-5xl font-black leading-none text-sprout-200/80 sm:text-[64px]">
                      {item.step}
                    </span>
                  </div>

                  <div className="text-3xl mb-4">{item.icon}</div>

                  <h3 className="text-xl font-bold text-text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom gradient line */}
                <div className={`absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r ${item.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </div>
            ))}
          </div>

          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-sprout-300/40 to-transparent -z-0" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOR GROWERS — Split section with glass mockup
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="growers" className="relative overflow-hidden px-4 py-20 sm:py-24 lg:py-32" ref={section2}>
        <div className="blob blob-animated w-[500px] h-[500px] bg-sprout-200/50 bottom-0 -left-20" />
        <div className="blob blob-animated-alt w-[300px] h-[300px] bg-sprout-100 top-20 right-0" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left — Content */}
            <div className="reveal-left">
              <span className="inline-block text-xs font-bold text-sprout-600 uppercase tracking-[0.2em] mb-4">
                For Growers
              </span>
              <h2 className="mb-6 text-3xl font-black leading-tight tracking-tight text-text-primary sm:text-5xl">
                Turn your space into a{" "}
                <span className="gradient-text">micro-farm</span>
              </h2>

              <div className="space-y-5">
                {[
                  {
                    icon: "📋",
                    title: "Day-by-day instructions",
                    desc: "Guided growing process for every tray, every crop",
                  },
                  {
                    icon: "💰",
                    title: "Earn ₹50+ per tray",
                    desc: "Consistent income from home, on your schedule",
                  },
                  {
                    icon: "⭐",
                    title: "Performance scoring",
                    desc: "Build reputation with yield, quality, and timeliness metrics",
                  },
                  {
                    icon: "🎯",
                    title: "Start with 5 trays",
                    desc: "Low barrier to entry, scale up as you grow",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-sprout-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sprout-200 transition-colors text-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary text-sm">
                        {item.title}
                      </h4>
                      <p className="text-text-muted text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/join/grower"
                className="inline-flex items-center gap-2 bg-sprout-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/20 mt-8 active:scale-[0.98]"
              >
                Start Growing
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Right — Glass mockup */}
            <div className="reveal-right">
              <div className="glass-strong relative p-4 float sm:p-6">
                <div className="absolute -top-3 -right-3 w-20 h-20 bg-sprout-400/20 rounded-full blur-2xl" />

                {/* Task card mockup */}
                <div className="bg-white/60 rounded-2xl p-5 border border-white/50 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-sprout-600 bg-sprout-100 px-2.5 py-1 rounded-full">
                      Day 4 of 9
                    </span>
                    <span className="text-xs text-text-muted">Sunflower Shoots</span>
                  </div>
                  <h4 className="font-semibold text-sm text-text-primary mb-2">
                    Remove cover, expose to light
                  </h4>
                  <p className="text-xs text-text-muted mb-3">
                    Water 150ml. Ensure good airflow around trays.
                  </p>
                  <div className="w-full bg-sprout-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-sprout-600 to-sprout-500 h-1.5 rounded-full w-[44%] transition-all" />
                  </div>
                </div>

                {/* Tray cards */}
                <div className="grid gap-3 min-[520px]:grid-cols-3">
                  {[
                    { crop: "Sunflower", trays: 5, status: "Growing" },
                    { crop: "Pea Shoots", trays: 3, status: "Sowing" },
                    { crop: "Radish", trays: 2, status: "Ready" },
                  ].map((item) => (
                    <div
                      key={item.crop}
                      className="bg-white/50 rounded-xl p-3 border border-white/40 hover:bg-white/70 transition-colors"
                    >
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {item.crop}
                      </p>
                      <p className="text-lg font-black text-sprout-800">
                        {item.trays}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.status === "Ready"
                          ? "bg-sprout-100 text-sprout-700"
                          : item.status === "Growing"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Earnings footer */}
                <div className="mt-4 pt-4 border-t border-white/30 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Est. this week</span>
                  <span className="text-lg font-black text-sprout-800">₹500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOR RESTAURANTS — Crop catalog mockup
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="restaurants" className="relative overflow-hidden px-4 py-20 sm:py-24 lg:py-32" ref={section3}>
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="blob blob-animated w-[400px] h-[400px] bg-sprout-300/30 top-10 -right-20" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left — Glass mockup */}
            <div className="order-2 lg:order-1 reveal-left">
              <div className="glass-strong relative p-4 float-delayed sm:p-6">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-sprout-300/30 rounded-full blur-2xl" />

                <h4 className="text-sm font-bold text-text-primary mb-4">Crop Catalog</h4>

                <div className="space-y-3">
                  {[
                    { name: "Sunflower Shoots", price: "₹450", cycle: "9 days", emoji: "🌻" },
                    { name: "Pea Shoots", price: "₹380", cycle: "8 days", emoji: "🫛" },
                    { name: "Radish Microgreens", price: "₹320", cycle: "7 days", emoji: "🌶️" },
                    { name: "Wheat Grass", price: "₹400", cycle: "10 days", emoji: "🌾" },
                    { name: "Mustard Greens", price: "₹350", cycle: "7 days", emoji: "🌿" },
                    { name: "Fenugreek", price: "₹360", cycle: "8 days", emoji: "🍃" },
                  ].map((crop) => (
                    <div
                      key={crop.name}
                      className="flex items-center gap-3 bg-white/50 rounded-xl p-3 border border-white/40 hover:bg-white/70 hover:border-sprout-200 transition-all cursor-pointer group"
                    >
                      <span className="text-xl">{crop.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-sprout-800 transition-colors">
                          {crop.name}
                        </p>
                        <p className="text-xs text-text-muted">{crop.cycle}</p>
                      </div>
                      <span className="text-sm font-bold text-sprout-800">
                        {crop.price}/kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Content */}
            <div className="order-1 lg:order-2 reveal-right">
              <span className="inline-block text-xs font-bold text-sprout-600 uppercase tracking-[0.2em] mb-4">
                For Restaurants
              </span>
              <h2 className="mb-6 text-3xl font-black leading-tight tracking-tight text-text-primary sm:text-5xl">
                The freshest{" "}
                <span className="gradient-text">microgreens</span>,
                <br />
                on schedule
              </h2>

              <div className="space-y-5">
                {[
                  {
                    icon: "🛒",
                    title: "6 varieties, transparent pricing",
                    desc: "Per-kg pricing with no hidden costs",
                  },
                  {
                    icon: "📡",
                    title: "Real-time order tracking",
                    desc: "Track from sowing to delivery on your dashboard",
                  },
                  {
                    icon: "🔄",
                    title: "Recurring deliveries",
                    desc: "Set up weekly or biweekly auto-orders",
                  },
                  {
                    icon: "✅",
                    title: "Quality guaranteed",
                    desc: "Multi-stage QC at field, hub, and delivery",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-sprout-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sprout-200 transition-colors text-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary text-sm">
                        {item.title}
                      </h4>
                      <p className="text-text-muted text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/join/restaurant"
                className="inline-flex items-center gap-2 bg-sprout-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/20 mt-8 active:scale-[0.98]"
              >
                Partner With Us
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL PROOF — Metric cards
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20 sm:py-24 lg:py-32" ref={section4}>
        <div className="absolute inset-0 bg-dots opacity-30" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl font-black tracking-tight text-text-primary sm:text-5xl">
              Built on a real <span className="gradient-text">system</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-text-secondary sm:text-lg">
              A demand engine and QC process, not just a pitch
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                value: 25,
                suffix: "%",
                label: "Production Buffer",
                desc: "Built into every plan",
                icon: "🌱",
              },
              {
                value: 6,
                suffix: "",
                label: "Microgreen Varieties",
                desc: "Sunflower to fenugreek",
                icon: "📊",
              },
              {
                value: 3,
                suffix: "",
                label: "Stage QC",
                desc: "Digital, hub & delivery checks",
                icon: "✅",
              },
              {
                value: 5,
                suffix: "",
                label: "Trays to Start",
                desc: "Low barrier grower onboarding",
                icon: "⚡",
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="reveal-scale glass-card p-6 text-center"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="text-3xl mb-3 block">{stat.icon}</span>
                <p className="text-3xl sm:text-4xl font-black text-sprout-800 mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm font-semibold text-text-primary mb-0.5">
                  {stat.label}
                </p>
                <p className="text-xs text-text-muted">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20 sm:py-24 lg:py-32" ref={section5}>
        <div className="blob blob-animated w-[400px] h-[400px] bg-sprout-200/50 top-0 left-1/4" />

        <div className="relative z-10 max-w-4xl mx-auto reveal">
          <div className="glass-strong relative overflow-hidden p-6 text-center sm:p-12 lg:p-20">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-grid opacity-20 rounded-[24px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-sprout-800/5 via-transparent to-sprout-600/5 rounded-[24px]" />

            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-black tracking-tight text-text-primary sm:text-5xl">
                Ready to grow
                <br />
                <span className="gradient-text-animated">with us?</span>
              </h2>
              <p className="mx-auto mb-8 max-w-md text-base text-text-secondary sm:mb-10 sm:text-lg">
                Join the microgreen revolution — whether you grow or you order,
                we&apos;ve got you covered.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/join/grower"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sprout-800 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-sprout-900 hover:shadow-xl hover:shadow-sprout-800/25 active:scale-[0.98] sm:w-auto sm:px-8"
                >
                  Join as Grower
                  <svg
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/join/restaurant"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-sprout-800/20 px-6 py-3.5 text-base font-semibold text-sprout-800 transition-all hover:border-sprout-800/40 hover:bg-sprout-50 active:scale-[0.98] sm:w-auto sm:px-8"
                >
                  Partner as Restaurant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-sprout-200/30 px-4 py-12 sm:py-16" ref={section6}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-12 mb-12 reveal">
            <div>
              <BrandLogo className="mb-4" />
              <p className="text-sm text-text-muted leading-relaxed">
                Demand-driven, decentralized microgreen production and supply platform.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-text-primary mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {["How it works", "For Growers", "For Restaurants", "About"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm text-text-muted hover:text-sprout-800 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-text-primary mb-4">Account</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/login" className="text-sm text-text-muted hover:text-sprout-800 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-sm text-text-muted hover:text-sprout-800 transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/join/grower" className="text-sm text-text-muted hover:text-sprout-800 transition-colors">
                    Grower Onboarding
                  </Link>
                </li>
                <li>
                  <Link href="/join/restaurant" className="text-sm text-text-muted hover:text-sprout-800 transition-colors">
                    Restaurant Onboarding
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="reveal pt-8 border-t border-sprout-200/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} SproutBox. All rights reserved.
            </p>
            <p className="text-xs text-text-muted">
              Made with 🌱 in India
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
