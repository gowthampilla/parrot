import type { Metadata } from "next";
import "./globals.css";
import { FloatingDock } from "@/components/layout/FloatingDock";

export const metadata: Metadata = {
  title: "Quad | Operating System for the Ambitious",
  description: "Discover builders, opportunities, and startup events around you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen pb-24">
        {children}
        <FloatingDock />
      </body>
    </html>
  );
}