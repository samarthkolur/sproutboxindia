import type { Config } from "tailwindcss";

// Semantic tokens are stored as space-separated RGB triplets in globals.css
// (--c-*), so Tailwind opacity modifiers (bg-panel/60) work in both themes.
const c = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── New design system (UI rework) ────────────────────────────────
        canvas: c("canvas"),
        panel: {
          DEFAULT: c("panel"), // translucent fill: use with alpha, e.g. bg-panel/60
          solid: c("panel-solid"),
        },
        inset: c("inset"),
        hairline: c("hairline"),
        ink: {
          DEFAULT: c("ink"),
          soft: c("ink-soft"),
          muted: c("ink-muted"),
        },
        brand: {
          DEFAULT: c("brand"), // charcoal on light, mint on dark (V1: the one accent)
          ink: c("brand-ink"),
        },
        leaf: {
          DEFAULT: c("leaf"), // data / progress green
          soft: c("leaf-soft"),
        },
        good: { DEFAULT: c("good"), soft: c("good-soft") },
        watch: { DEFAULT: c("watch"), soft: c("watch-soft") },
        risk: { DEFAULT: c("risk"), soft: c("risk-soft") },

        // ── shadcn names, remapped onto the new tokens ───────────────────
        background: c("canvas"),
        foreground: c("ink"),
        card: {
          DEFAULT: c("panel-solid"),
          foreground: c("ink"),
        },
        popover: {
          DEFAULT: c("panel-solid"),
          foreground: c("ink"),
        },
        primary: {
          DEFAULT: c("brand"),
          foreground: c("brand-ink"),
        },
        secondary: {
          DEFAULT: c("inset"),
          foreground: c("ink"),
        },
        muted: {
          DEFAULT: c("inset"),
          foreground: c("ink-muted"),
        },
        accent: {
          DEFAULT: c("inset"),
          foreground: c("ink"),
        },
        destructive: {
          DEFAULT: c("risk"),
        },
        border: c("hairline"),
        input: c("hairline"),
        ring: c("brand"),
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: c("leaf"),
          2: c("brand"),
          3: c("watch"),
          4: c("ink-soft"),
          5: c("good"),
        },

        // ── Legacy palette (kept until every page is converted) ──────────
        sprout: {
          50: "#F4FCF6",
          100: "#EAFBEF",
          200: "#D8F3DC",
          300: "#B7E4C7",
          400: "#95D5B2",
          500: "#74C69D",
          600: "#52B788",
          700: "#40916C",
          800: "#2D6A4F",
          900: "#1A3A2E",
          950: "#1B4332",
        },
        text: {
          primary: "#1B1F1D",
          secondary: "#4A5250",
          muted: "#8A9490",
          inverse: "#FFFFFF",
        },
        status: {
          success: "#52B788",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        // Outfit has no Kannada/Devanagari glyphs, so those scripts get their own faces.
        sans: [
          "var(--font-outfit)",
          "var(--font-kannada)",
          "var(--font-devanagari)",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        // Floor of 12px: the reference frames use ~9-10px, which is unreadable.
        micro: ["0.75rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
        tile: "16px",
        panel: "22px",
        shell: "28px",
      },
      boxShadow: {
        panel: "0 1px 2px rgb(var(--c-shadow) / 0.06), 0 8px 24px rgb(var(--c-shadow) / 0.08)",
        pop: "0 12px 40px rgb(var(--c-shadow) / 0.18)",
      },
      keyframes: {
        "progress-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "sheet-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "progress-sweep": "progress-sweep 1.1s ease-in-out infinite",
        "sheet-in": "sheet-in 160ms ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};

export default config;
