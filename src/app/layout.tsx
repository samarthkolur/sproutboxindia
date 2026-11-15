import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Noto_Sans_Kannada, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { ThemeProvider, themeInitScript } from "@/components/layout/ThemeProvider";
import { TopProgress } from "@/components/shared/TopProgress";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { GoogleAnalyticsPageview } from "@/components/shared/GoogleAnalyticsPageview";

// Outfit has no Kannada or Devanagari glyphs, so those scripts get their own faces
// (non-Latin subsets are not preloaded; they load only when the text appears).
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const notoKannada = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-kannada", display: "swap", preload: false });
const notoDevanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", display: "swap", preload: false });

export const metadata: Metadata = {
  title: {
    default: "SproutBox",
    template: "%s | SproutBox",
  },
  description:
    "Demand-driven, decentralized microgreen production and supply platform connecting restaurants with home-based growers.",
  keywords: ["microgreens", "farm-to-fork", "B2B", "food-tech", "sustainable"],
  openGraph: {
    title: "SproutBox",
    description: "Demand-driven microgreen supply platform for restaurants and growers.",
    siteName: "SproutBox",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${notoKannada.variable} ${notoDevanagari.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased overflow-x-hidden">
        <GoogleAnalytics />
        <GoogleAnalyticsPageview />
        <Analytics />
        <ThemeProvider>
          <LanguageProvider>
            <TopProgress />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
