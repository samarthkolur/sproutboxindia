import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { FloatingLanguageToggle } from "@/components/i18n/LanguageToggle";
import { GlobalLoadingIndicator } from "@/components/shared/GlobalLoadingIndicator";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";

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
    <html lang="en">
      <body className="min-h-screen antialiased overflow-x-hidden">
        <GoogleAnalytics />
        <Analytics />
        <LanguageProvider>
          {children}
          <FloatingLanguageToggle />
          <GlobalLoadingIndicator />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
