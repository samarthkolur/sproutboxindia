import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SproutBox — Farm-to-Fork Microgreen Platform",
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
