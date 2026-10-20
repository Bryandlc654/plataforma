import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { brandingCssVars, fetchPlatformBranding } from "@/lib/platform-branding";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Build Iceberg Agency - Crea tu presencia digital",
    template: "%s | Build Iceberg Agency",
  },
  description:
    "Crea, administra y publica tu presencia digital profesional sin conocimientos técnicos. Sitios web, leads, analíticas y más.",
  keywords: ["sitios web", "presencia digital", "negocios", "SaaS", "landing page"],
  robots: {
    index: true,
    follow: true,
  },
};

import { Providers } from "@/components/providers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await fetchPlatformBranding();
  const brandingVars = brandingCssVars(branding) as CSSProperties;

  return (
    <html lang="es" className={inter.variable} style={brandingVars}>
      <head>
        {/* Material Symbols */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50">
        <Providers initialBranding={branding}>{children}</Providers>
      </body>
    </html>
  );
}
