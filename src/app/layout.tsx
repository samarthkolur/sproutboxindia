import type { Metadata } from "next";
import "@/app/globals.css";
import "leaflet/dist/leaflet.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { FloatingLanguageToggle } from "@/components/i18n/LanguageToggle";
import { GlobalLoadingIndicator } from "@/components/shared/GlobalLoadingIndicator";

export const metadata: Metadata = {
  title: "SproutBox",
  description:
    "Demand-driven, decentralized microgreen production and supply platform connecting restaurants with home-based growers.",
  keywords: ["microgreens", "farm-to-fork", "B2B", "food-tech", "sustainable"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          {children}
          <FloatingLanguageToggle />
          <GlobalLoadingIndicator />
        </LanguageProvider>
      </body>
    </html>
  );
}
